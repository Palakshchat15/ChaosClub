import os
import requests
from dotenv import load_dotenv

if not os.getenv("RENDER"):
    load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

def send_verification_email(to_email: str, code: str):
    if not RESEND_API_KEY:
        print(f"DEBUG: RESEND_API_KEY not set. Verification code for {to_email} is: {code}")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    html_content = f"""
    <html>
      <body style="background-color: #0d1117; color: #ffffff; font-family: sans-serif; padding: 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #161b22; padding: 30px; border-radius: 12px; border: 1px solid #52ff1a;">
          <h1 style="color: #52ff1a;">CHAOS CLUB</h1>
          <p style="font-size: 16px;">Welcome to the club! Use the code below to verify your email and complete your signup.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #52ff1a; margin: 20px 0;">
            {code}
          </div>
          <p style="font-size: 12px; color: #8b949e;">This code will expire in 10 minutes.</p>
        </div>
      </body>
    </html>
    """

    payload = {
        "from": "Chaos Club <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Chaos Club - Verification Code",
        "html": html_content
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            print(f"SUCCESS: Resend verification email sent to {to_email}")
            return True
        else:
            print(f"ERROR: Resend API failed: {response.text}")
            return False
    except Exception as e:
        print(f"CRITICAL ERROR calling Resend: {e}")
        return False

def send_new_article_email(to_email: str, article_title: str, article_id: int):
    if not RESEND_API_KEY:
        return False

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    html_content = f"""
    <html>
      <body style="background-color: #0d1117; color: #ffffff; font-family: sans-serif; padding: 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #161b22; padding: 30px; border-radius: 12px; border: 1px solid #52ff1a;">
          <h2 style="color: #52ff1a;">CHAOS CLUB - CONTENT ALERT</h2>
          <p style="font-size: 18px; font-weight: bold;">{article_title}</p>
          <p style="font-size: 14px; color: #8b949e;">We just published a new article. Be the first to read it and join the discussion!</p>
          <a href="{frontend_url}/news/{article_id}" style="display: inline-block; background-color: #52ff1a; color: #0d1117; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">Read Full Article</a>
          <p style="font-size: 10px; color: #484f58;">You're receiving this because you're a member of the Chaos Club.</p>
        </div>
      </body>
    </html>
    """

    payload = {
        "from": "Chaos Club <onboarding@resend.dev>",
        "to": [to_email],
        "subject": f"New Article: {article_title}",
        "html": html_content
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error sending Resend article alert: {e}")
        return False
