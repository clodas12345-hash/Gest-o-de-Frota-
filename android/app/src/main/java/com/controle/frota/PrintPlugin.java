package com.controle.frota;

import android.content.Context;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
}
