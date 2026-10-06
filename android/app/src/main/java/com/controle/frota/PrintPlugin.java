package com.controle.frota;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import androidx.core.content.FileProvider;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativePrint")
public class PrintPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString("title", "Documento - Gestao de Frota");

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) {
                        call.reject("Serviço de impressão não disponível neste dispositivo.");
                        return;
                    }

                    if (html != null && !html.isEmpty()) {
                        // Create temporary WebView to render HTML and feed directly to Android PrintManager
                        final WebView printWebView = new WebView(getContext());
                        printWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public void onPageFinished(WebView view, String url) {
                                super.onPageFinished(view, url);
                                PrintDocumentAdapter printAdapter = printWebView.createPrintDocumentAdapter(jobName);
                                printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                            }
                        });
                        printWebView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
                    } else {
                        // Fallback: print from current bridge webview
                        PrintDocumentAdapter printAdapter = getBridge().getWebView().createPrintDocumentAdapter(jobName);
                        printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                    }

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Erro ao acionar impressora nativa: " + e.getMessage(), e);
                }
            }
        });
    }

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        final String base64Data = call.getString("base64", "");
        final String rawFileName = call.getString("fileName", "documento.pdf");
        final String mimeType = call.getString("mimeType", "application/pdf");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Dados do arquivo vazios.");
            return;
        }

        try {
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            final String safeName = rawFileName.replaceAll("[\\\\/:*?\"<>|]", "_");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                ContentResolver resolver = getContext().getContentResolver();
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    throw new Exception("Não foi possível criar o arquivo na pasta Downloads.");
                }
                OutputStream out = resolver.openOutputStream(uri);
                if (out == null) {
                    throw new Exception("Não foi possível abrir o fluxo de gravação.");
                }
                out.write(fileBytes);
                out.flush();
                out.close();
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File destFile = new File(downloadsDir, safeName);
                FileOutputStream fos = new FileOutputStream(destFile);
                fos.write(fileBytes);
                fos.flush();
                fos.close();
            }

            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(getContext(), "✅ Salvo em Downloads: " + safeName, Toast.LENGTH_LONG).show();
                }
            });

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("fileName", safeName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Erro ao salvar em Downloads: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        final String base64Data = call.getString("base64", "");
        final String rawFileName = call.getString("fileName", "documento.pdf");
        final String mimeType = call.getString("mimeType", "application/pdf");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Dados do arquivo vazios.");
            return;
        }

        try {
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            final String safeName = rawFileName.replaceAll("[\\\\/:*?\"<>|]", "_");
            File cacheFile = new File(getContext().getCacheDir(), safeName);
            FileOutputStream fos = new FileOutputStream(cacheFile);
            fos.write(fileBytes);
            fos.flush();
            fos.close();

            final Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                cacheFile
            );

            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setDataAndType(contentUri, mimeType);
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                        Intent chooser = Intent.createChooser(intent, "Abrir documento com");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(chooser);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                    } catch (Exception ex) {
                        call.reject("Nenhum leitor de PDF encontrado: " + ex.getMessage(), ex);
                    }
                }
            });
        } catch (Exception e) {
            call.reject("Erro ao abrir documento: " + e.getMessage(), e);
        }
    }
}
