# Code Signing — Windows NSIS Installer

The build is wired to sign automatically when a valid OV `.pfx`/`.p12` certificate
and its password are provided via environment variables. Configuration lives in
`electron-builder.yml` under `win.signtoolOptions`.

> **Why not in this sandbox?** Authenticode signing requires Microsoft's
> `signtool.exe` (or an equivalent like `osslsigncode`). The Lovable sandbox
> cannot ship your private `.pfx` securely, and `signtool.exe` is Windows-only.
> Run the signed build on your own Windows machine or in CI (GitHub Actions
> `windows-latest` runner works well).

---

## 1. One-time setup on the signing machine

1. Install Node.js 20+ and Git.
2. Clone this repo and run `npm install`.
3. Copy your certificate file somewhere safe, e.g. `C:\certs\b313-ov.pfx`.
4. **Never commit the .pfx or the password to git.**

## 2. Set environment variables

`electron-builder` automatically picks up these two:

| Variable | Value |
|---|---|
| `CSC_LINK` | Absolute path to the `.pfx` file, **or** a `base64:` string, **or** an `https://` URL. |
| `CSC_KEY_PASSWORD` | The password that protects the `.pfx`. |

### PowerShell (local machine)
```powershell
$env:CSC_LINK = "C:\certs\b313-ov.pfx"
$env:CSC_KEY_PASSWORD = "your-pfx-password"
```

### CMD
```cmd
set CSC_LINK=C:\certs\b313-ov.pfx
set CSC_KEY_PASSWORD=your-pfx-password
```

### GitHub Actions (recommended for repeatable releases)
Store the cert as a **base64-encoded** repository secret:

```bash
# On your local machine, encode the pfx once:
certutil -encode b313-ov.pfx b313-ov.b64
# Paste the contents (without the BEGIN/END lines) into a secret named CSC_LINK_B64
```

Then in `.github/workflows/release.yml`:
```yaml
- name: Build & sign Windows installer
  env:
    CSC_LINK: ${{ secrets.CSC_LINK_B64 }}   # electron-builder accepts base64 directly
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
  run: |
    npm ci
    npm run build
    npx electron-builder --win nsis --x64 --config electron-builder.yml
```

## 3. Build the signed installer

```bash
npm run build
npx electron-builder --win nsis --x64 --config electron-builder.yml
```

Output: `installer-release/B31.3-Assistant-Setup-1.0.0.exe` — both the app
executable inside the package **and** the installer itself will be signed and
RFC-3161 timestamped against `timestamp.digicert.com`.

## 4. Verify the signature

On Windows:
```powershell
Get-AuthenticodeSignature "installer-release\B31.3-Assistant-Setup-1.0.0.exe"
```
You should see `Status: Valid` and `SignerCertificate` with your subject name.

Or right-click the `.exe` → **Properties → Digital Signatures** tab.

## 5. SmartScreen reputation expectations

- **OV certificates do not get instant SmartScreen trust.** Only EV certs do.
- After signing, the "Unknown publisher" warning is replaced by your verified
  publisher name ("Nosa Imasuen").
- SmartScreen "Windows protected your PC" may still appear for the first
  several hundred to few thousand downloads. It disappears automatically as
  Microsoft's reputation system observes the signed binary in the wild.
- To accelerate reputation: distribute from a single stable URL, do not
  re-issue the cert for minor versions, and submit the file to Microsoft via
  https://www.microsoft.com/en-us/wdsi/filesubmission for analysis.
- Most major AV vendors (Defender, Kaspersky, BitDefender) stop flagging
  signed Electron installers within 1–2 weeks of public distribution.

## 6. Renewal / cert expiry

Because we use RFC-3161 timestamping, installers signed today remain trusted
**after** your certificate expires. You only need to re-sign new releases with
the renewed cert.

## 7. Troubleshooting

| Error | Cause / fix |
|---|---|
| `Cannot find signtool.exe` | Install Windows SDK or run on `windows-latest` runner. |
| `SignerSign() failed: 0x80070002` | `CSC_LINK` path is wrong or file unreadable. |
| `password is incorrect` | `CSC_KEY_PASSWORD` mismatch. |
| `The timestamp server failed` | Try `http://timestamp.sectigo.com` or `http://ts.ssl.com` — edit `electron-builder.yml`. |
| Installer signed but app .exe inside is not | electron-builder signs both by default; ensure you didn't override `signAndEditExecutable: false`. |
