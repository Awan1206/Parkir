<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 480px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #1e3a5f;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
        }
        .body {
            padding: 32px 24px;
            color: #333333;
        }
        .body p {
            margin: 0 0 16px;
            line-height: 1.6;
            font-size: 14px;
        }
        .otp-box {
            background-color: #f0f4f8;
            border: 2px dashed #1e3a5f;
            border-radius: 8px;
            text-align: center;
            padding: 20px;
            margin: 24px 0;
        }
        .otp-box span {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #1e3a5f;
        }
        .warning {
            background-color: #fff8e1;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 13px;
            color: #92400e;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 16px 24px;
            text-align: center;
            font-size: 11px;
            color: #999999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
        </div>
        <div class="body">
            <p>Halo, <strong>{{ $name }}</strong>.</p>
            <p>Kami menerima permintaan reset password untuk akun Anda. Gunakan kode OTP berikut:</p>

            <div class="otp-box">
                <span>{{ $otp }}</span>
            </div>

            <p>Kode ini berlaku selama <strong>5 menit</strong> dan hanya dapat digunakan satu kali.</p>

            <div class="warning">
                Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Jangan berikan kode OTP kepada siapapun.
            </div>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>