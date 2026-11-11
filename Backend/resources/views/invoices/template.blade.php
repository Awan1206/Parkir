<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td { padding: 6px 8px; }
        .label { width: 40%; color: #666; }
        .divider { border-top: 1px solid #ddd; margin: 10px 0; }
        .total { font-size: 14px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>INVOICE PARKIR</h2>
        <p>{{ $invoice->invoice_number }}</p>
        <p>{{ $invoice->issued_at?->format('d/m/Y H:i') }}</p>
    </div>

    <div class="divider"></div>

    <table>
        <tr>
            <td class="label">Jenis Transaksi</td>
            <td>{{ str_replace('_', ' ', strtoupper($invoice->type)) }}</td>
        </tr>
        <tr>
            <td class="label">Nama</td>
            <td>{{ $invoice->recipient_name }}</td>
        </tr>
        @if($invoice->plate_number)
        <tr>
            <td class="label">Plat Nomor</td>
            <td>{{ $invoice->plate_number }}</td>
        </tr>
        <tr>
            <td class="label">Jenis Kendaraan</td>
            <td>{{ ucfirst($invoice->vehicle_type) }}</td>
        </tr>
        <tr>
            <td class="label">Waktu Masuk</td>
            <td>{{ $invoice->entry_time?->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Waktu Keluar</td>
            <td>{{ $invoice->exit_time?->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Durasi</td>
            <td>{{ $invoice->duration_minutes ? floor($invoice->duration_minutes / 60) . ' jam ' . ($invoice->duration_minutes % 60) . ' menit' : '-' }}</td>
        </tr>
        @endif
        <tr>
            <td class="label">Diproses Oleh</td>
            <td>{{ $invoice->issuedBy?->name }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <table>
        <tr>
            <td class="label total">TOTAL PEMBAYARAN</td>
            <td class="total">Rp {{ number_format($invoice->amount, 0, ',', '.') }}</td>
        </tr>
    </table>

    <div class="footer">
        <p>Dokumen ini diterbitkan secara otomatis oleh sistem.</p>
        <p>Terima kasih telah menggunakan layanan parkir kami.</p>
    </div>
</body>
</html>