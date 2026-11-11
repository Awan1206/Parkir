<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }

        html, body {
            width: 242pt;
            height: 153pt;
            background-color: #ffffff;
            color: #0f172a;
            font-family: sans-serif;
            overflow: hidden;
        }

        /* Garis aksen di sisi kiri */
        .accent {
            position: absolute;
            top: 0;
            left: 0;
            width: 7pt;
            height: 153pt;
            background-color: #2563eb;
        }

        /* Lebar 204 + padding 22 + 16 = 242pt, tinggi 129 + 14 + 10 = 153pt */
        .card {
            width: 204pt;
            height: 129pt;
            padding: 14pt 16pt 10pt 22pt;
            overflow: hidden;
            page-break-inside: avoid;
        }

        table { width: 100%; border-collapse: collapse; }

        /* Header */
        .header { margin-bottom: 8pt; }
        .brand {
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 1.5px;
            color: #2563eb;
        }
        .card-label {
            font-size: 6pt;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #94a3b8;
            text-align: right;
        }

        /* Isi utama */
        .main { margin-bottom: 8pt; }
        .member-name {
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4pt;
        }
        .member-code {
            font-family: courier, monospace;
            font-size: 8pt;
            font-weight: bold;
            letter-spacing: 1px;
            color: #2563eb;
            margin-bottom: 3pt;
        }
        .member-phone { font-size: 7.5pt; color: #64748b; }

        .qr-wrap {
            width: 54pt;
            height: 54pt;
            padding: 3pt;
            background-color: #ffffff;
            border: 0.75pt solid #e2e8f0;
        }
        .qr-wrap img { width: 54pt; height: 54pt; }

        /* Masa berlaku */
        .validity { border-top: 0.75pt solid #e2e8f0; }
        .validity td { padding-top: 6pt; }
        .validity-label {
            font-size: 5.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 2pt;
        }
        .validity-value {
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f172a;
        }
    </style>
</head>
<body>
<div class="accent"></div>

<div class="card">

    <table class="header">
        <tr>
            <td><div class="brand">ParkOps</div></td>
            <td><div class="card-label">Kartu Member</div></td>
        </tr>
    </table>

    <table class="main">
        <tr>
            <td style="vertical-align: middle;">
                <div class="member-name">{{ $member->name }}</div>
                <div class="member-code">{{ $member->member_code }}</div>
                <div class="member-phone">{{ $member->phone }}</div>
            </td>
            <td style="vertical-align: middle; width: 62pt;">
                <div class="qr-wrap">
                    <img src="{{ $qrImage }}" alt="QR">
                </div>
            </td>
        </tr>
    </table>

    <table class="validity">
        <tr>
            <td style="width: 50%;">
                <div class="validity-label">Berlaku mulai</div>
                <div class="validity-value">{{ $member->membership_start?->format('d M Y') ?? '-' }}</div>
            </td>
            <td style="width: 50%;">
                <div class="validity-label">Berlaku hingga</div>
                <div class="validity-value">{{ $member->membership_end?->format('d M Y') ?? '-' }}</div>
            </td>
        </tr>
    </table>

</div>
</body>
</html>