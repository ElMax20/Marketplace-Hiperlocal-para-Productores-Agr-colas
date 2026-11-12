import subprocess
import time
import json
import urllib.request
import os

# 1. Start Chrome in headless mode with debugging port
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    "--remote-debugging-port=9333",
    "--disable-gpu",
    "--no-sandbox",
    "about:blank"
])

time.sleep(2)

try:
    # 2. Get websocket debugger URL
    resp = urllib.request.urlopen("http://127.0.0.1:9333/json")
    tabs = json.loads(resp.read().decode())
    ws_url = tabs[0]["webSocketDebuggerUrl"]
    print(f"Connected to Chrome CDP: {ws_url}")

    # Use websocket client (simple via standard library or python websocket module if present)
    # Let's check if websocket is available or use a lightweight python script
except Exception as e:
    print("CDP Connect error:", e)
finally:
    proc.terminate()
