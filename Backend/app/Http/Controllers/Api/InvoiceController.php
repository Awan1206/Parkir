<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with('issuedBy')->findOrFail($id);

        $this->authorizeInvoiceAccess($request, $invoice);

        return response()->json([
            'success' => true,
            'data'    => new InvoiceResource($invoice),
        ]);
    }

    public function downloadPdf(Request $request, int $id): Response
    {
        $invoice = Invoice::with('issuedBy', 'memberPayment.member', 'parkingTransaction')->findOrFail($id);

        $this->authorizeInvoiceAccess($request, $invoice);

        $pdf = Pdf::loadView('invoices.template', ['invoice' => $invoice]);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    private function authorizeInvoiceAccess(Request $request, Invoice $invoice): void
    {
        $user = $request->user();

        if ($user->isPetugas() && $invoice->issued_by !== (int) $user->id) {
            abort(403, 'Akses ditolak.');
        }
    }
}