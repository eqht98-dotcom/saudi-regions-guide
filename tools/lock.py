#!/usr/bin/env python3
"""Encrypt / decrypt the site behind a password.

  encrypt: python3 tools/lock.py encrypt page.html site.enc PASSWORD [voices.json]
  decrypt: python3 tools/lock.py decrypt site.enc page.html PASSWORD

site.enc = salt(16) | iv(12) | AES-256-GCM ciphertext, key = PBKDF2-SHA256(password, salt, 600000).
If voices.json ({region_id: base64 mp3}) is given, each story is re-encoded to 64 kbps mono
and embedded in the page as <script id="vo">var VO={...}</script>.
"""
import base64, json, os, re, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ITER = 600000


def key(pw, salt):
    return PBKDF2HMAC(hashes.SHA256(), 32, salt, ITER).derive(pw.encode())


def shrink(mp3):
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, "i.mp3"), os.path.join(d, "o.mp3")
        open(i, "wb").write(mp3)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", i, "-ac", "1", "-b:a", "64k", o], check=True)
        return open(o, "rb").read()


def embed(html, voices_path):
    v = json.load(open(voices_path))
    vo = {k: "data:audio/mpeg;base64," + base64.b64encode(shrink(base64.b64decode(b))).decode() for k, b in v.items()}
    html = re.sub(r'<script id="vo">.*?</script>\n?', "", html, flags=re.S)
    tag = '<script id="vo">var VO=' + json.dumps(vo) + "</script>\n"
    i = html.rindex("<script>")
    return html[:i] + tag + html[i:]


def main():
    mode, src, dst, pw = sys.argv[1:5]
    if mode == "encrypt":
        html = open(src, encoding="utf-8").read()
        if len(sys.argv) > 5:
            html = embed(html, sys.argv[5])
        salt, iv = os.urandom(16), os.urandom(12)
        open(dst, "wb").write(salt + iv + AESGCM(key(pw, salt)).encrypt(iv, html.encode(), None))
    else:
        b = open(src, "rb").read()
        open(dst, "w", encoding="utf-8").write(AESGCM(key(pw, b[:16])).decrypt(b[16:28], b[28:], None).decode())


if __name__ == "__main__":
    main()
