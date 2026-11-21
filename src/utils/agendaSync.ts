import { Capacitor } from '@capacitor/core';
import { Contacts, PhoneType, EmailType, PostalAddressType } from '@capacitor-community/contacts';
import { AgendaContact, Vehicle } from '../types';

const DEVICE_PHONEBOOK_SYNC_KEY = 'fleet_device_phonebook_synced';
const syncingPhoneKeysInFlight = new Set<string>();

export function normalizeAgendaPhone(raw?: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
}

export function isActiveContractVehicle(vehicle: Pick<Vehicle, 'driver'>): boolean {
  const driver = (vehicle.driver || '').trim().toLowerCase();
  if (!driver) return false;
  return driver !== 'não definido' && driver !== 'nao definido' && driver !== 'não informado' && driver !== 'nao informado' && driver !== 'sem motorista';
}

function getPhoneSuffix(raw?: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-8) : digits;
}

function cleanDocDigits(raw?: string): string {
  return (raw || '').replace(/\D/g, '');
}

export function buildContactFromVehicle(vehicle: Vehicle): AgendaContact | null {
  if (!isActiveContractVehicle(vehicle)) return null;
  const cleanName = vehicle.driver.trim();
  const normalizedPhone = normalizeAgendaPhone(vehicle.driverPhone);
  const plateUpper = (vehicle.plate || '').trim().toUpperCase() || undefined;

  return {
    id: `drv-${vehicle.id}`,
    name: cleanName,
    phone: normalizedPhone || (vehicle.driverPhone || '').trim(),
    region: 'Locatário',
    cpfCnpj: vehicle.tenantCpfCnpj?.trim() || undefined,
    rg: vehicle.tenantRg?.trim() || undefined,
    cnh: vehicle.tenantCnh?.trim() || undefined,
    cnhExpiration: vehicle.driverCnhExpiration || undefined,
    cnhPhotoUrl: vehicle.driverCnhPhotoUrl || undefined,
    addressProofUrl: vehicle.driverAddressProofUrl || undefined,
    email: vehicle.tenantEmail?.trim() || undefined,
    address: vehicle.tenantAddress?.trim() || undefined,
    activeVehiclePlate: plateUpper,
  };
}

function mergeAgendaContact(existing: AgendaContact, incoming: AgendaContact): { merged: AgendaContact; changed: boolean } {
  const pick = (nextVal?: string, prevVal?: string): string | undefined => {
    const n = (nextVal || '').trim();
    if (n) return n;
    const p = (prevVal || '').trim();
    return p || undefined;
  };

  const merged: AgendaContact = {
    ...existing,
    id: existing.id || incoming.id,
    name: pick(incoming.name, existing.name) || existing.name,
    phone: pick(incoming.phone, existing.phone) || '',
    region: pick(incoming.region, existing.region) || 'Locatário',
    cpfCnpj: pick(incoming.cpfCnpj, existing.cpfCnpj),
    rg: pick(incoming.rg, existing.rg),
    cnh: pick(incoming.cnh, existing.cnh),
    cnhCategory: pick(incoming.cnhCategory, existing.cnhCategory),
    cnhExpiration: pick(incoming.cnhExpiration, existing.cnhExpiration),
    cnhPhotoUrl: pick(incoming.cnhPhotoUrl, existing.cnhPhotoUrl),
    addressProofUrl: pick(incoming.addressProofUrl, existing.addressProofUrl),
    email: pick(incoming.email, existing.email),
    address: pick(incoming.address, existing.address),
    notes: pick(incoming.notes, existing.notes),
    activeVehiclePlate: incoming.activeVehiclePlate !== undefined ? incoming.activeVehiclePlate : existing.activeVehiclePlate,
  };

  const changed =
    merged.name !== existing.name ||
    merged.phone !== existing.phone ||
    merged.region !== existing.region ||
    merged.cpfCnpj !== existing.cpfCnpj ||
    merged.rg !== existing.rg ||
    merged.cnh !== existing.cnh ||
    merged.cnhCategory !== existing.cnhCategory ||
    merged.cnhExpiration !== existing.cnhExpiration ||
    merged.cnhPhotoUrl !== existing.cnhPhotoUrl ||
    merged.addressProofUrl !== existing.addressProofUrl ||
    merged.email !== existing.email ||
    merged.address !== existing.address ||
    merged.notes !== existing.notes ||
    merged.activeVehiclePlate !== existing.activeVehiclePlate;

  return { merged, changed };
}

export function upsertContactInList(
  prev: AgendaContact[],
  incoming: AgendaContact
): { next: AgendaContact[]; changed: boolean } {
  const incomingName = (incoming.name || '').trim().toLowerCase();
  const incomingSuffix = getPhoneSuffix(incoming.phone);
  const incomingCpf = cleanDocDigits(incoming.cpfCnpj);

  const matchIdx = prev.findIndex((c) => {
    if (c.id && incoming.id && c.id === incoming.id) return true;
    const cSuffix = getPhoneSuffix(c.phone);
    if (incomingSuffix.length >= 8 && cSuffix && cSuffix === incomingSuffix) return true;
    const cCpf = cleanDocDigits(c.cpfCnpj);
    if (incomingCpf.length >= 11 && cCpf && cCpf === incomingCpf) return true;
    if (incomingName && (c.name || '').trim().toLowerCase() === incomingName) return true;
    return false;
  });

  if (matchIdx >= 0) {
    const { merged, changed } = mergeAgendaContact(prev[matchIdx], incoming);
    if (!changed) return { next: prev, changed: false };
    const next = [...prev];
    next[matchIdx] = merged;
    return { next, changed: true };
  }

  return {
    next: [
      {
        ...incoming,
        id: incoming.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phone: normalizeAgendaPhone(incoming.phone) || incoming.phone || '',
        region: incoming.region || 'Locatário',
      },
      ...prev,
    ],
    changed: true,
  };
}

export async function syncDriverToDevicePhonebook(params: {
  name: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  cnh?: string;
  address?: string;
  plate?: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const cleanName = (params.name || '').trim();
  const normalizedPhone = normalizeAgendaPhone(params.phone);
  const phoneSuffix = getPhoneSuffix(normalizedPhone);
  if (!cleanName || phoneSuffix.length < 8) return;

  const dedupeKey = `${cleanName.toLowerCase()}:${phoneSuffix}`;
  if (syncingPhoneKeysInFlight.has(dedupeKey)) return;

  try {
    const rawSynced = localStorage.getItem(DEVICE_PHONEBOOK_SYNC_KEY);
    const syncedMap: Record<string, boolean> = rawSynced ? JSON.parse(rawSynced) : {};
    if (syncedMap[dedupeKey]) return;

    syncingPhoneKeysInFlight.add(dedupeKey);

    let perm = await Contacts.checkPermissions();
    if (perm.contacts !== 'granted') {
      perm = await Contacts.requestPermissions();
    }
    if (perm.contacts !== 'granted') return;

    // Check existing contacts in phonebook to avoid duplicating contacts on device
    try {
      const existingRes = await Contacts.getContacts({
        projection: { name: true, phones: true },
      });
      const alreadyExists = (existingRes?.contacts || []).some((c) => {
        const hasPhone = (c.phones || []).some((p) => getPhoneSuffix(p.number || '') === phoneSuffix);
        const sameName = (c.name?.display || c.name?.given || '').trim().toLowerCase() === cleanName.toLowerCase();
        return hasPhone || (sameName && phoneSuffix.length === 0);
      });
      if (alreadyExists) {
        syncedMap[dedupeKey] = true;
        localStorage.setItem(DEVICE_PHONEBOOK_SYNC_KEY, JSON.stringify(syncedMap));
        return;
      }
    } catch {
      // Proceed to create if listing fails
    }

    const nameParts = cleanName.split(/\s+/);
    const given = nameParts[0] || cleanName;
    const family = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const noteLines = [
      'Locatário - Gestão de Frota',
      params.plate ? `Veículo: ${params.plate.toUpperCase()}` : '',
      params.cpfCnpj ? `CPF/CNPJ: ${params.cpfCnpj}` : '',
      params.cnh ? `CNH: ${params.cnh}` : '',
    ].filter(Boolean);

    await Contacts.createContact({
      contact: {
        name: {
          given,
          family: family || undefined,
        },
        organization: {
          company: 'Gestão de Frota (Locatário)',
          jobTitle: params.plate ? `Placa ${params.plate.toUpperCase()}` : 'Motorista',
        },
        phones: [
          {
            type: PhoneType.Mobile,
            number: `+${normalizedPhone}`,
            isPrimary: true,
          },
        ],
        emails: params.email?.trim()
          ? [
              {
                type: EmailType.Home,
                address: params.email.trim(),
                isPrimary: true,
              },
            ]
          : undefined,
        postalAddresses: params.address?.trim()
          ? [
              {
                type: PostalAddressType.Home,
                street: params.address.trim(),
                isPrimary: true,
              },
            ]
          : undefined,
        note: noteLines.join(' | '),
      },
    });

    syncedMap[dedupeKey] = true;
    localStorage.setItem(DEVICE_PHONEBOOK_SYNC_KEY, JSON.stringify(syncedMap));
  } catch (err) {
    console.warn('Não foi possível salvar contato na agenda telefônica do aparelho:', err);
  } finally {
    syncingPhoneKeysInFlight.delete(dedupeKey);
  }
}
