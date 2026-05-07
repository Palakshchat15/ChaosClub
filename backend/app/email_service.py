import aiosmtplib
import os
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

if not os.getenv("RENDER"):
    load_dotenv()

async def send_verification_email(to_email: str, code: str):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    if not email_user or not email_password:
        if not email_user: print("DEBUG: EMAIL_USER is missing from environment!")
        if not email_password: print("DEBUG: EMAIL_PASSWORD is missing from environment!")
        print(f"--- VERIFICATION CODE for {to_email}: {code} ---")
        return False

    subject = "Chaos Club - Verification Code"
    body = f"""
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

    msg = MIMEMultipart()
    msg['From'] = f"Chaos Club <{email_user}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        # Port 587 + start_tls=True is the most compatible combination for Render
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=email_user,
            password=email_password,
        )
        print(f"SUCCESS: Verification email sent to {to_email}")
        return True
    except Exception as e:
        print(f"CRITICAL ERROR sending email to {to_email}: {e}")
        return False

async def send_new_article_email(to_email: str, article_title: str, article_id: int):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    if not email_user or not email_password:
        if not email_user: print("DEBUG: EMAIL_USER is missing for article alerts!")
        if not email_password: print("DEBUG: EMAIL_PASSWORD is missing for article alerts!")
        print(f"DEBUG: New article alert for {to_email}: {article_title}")
        return False

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    subject = f"New Article: {article_title}"
    body = f"""
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

    msg = MIMEMultipart()
    msg['From'] = f"Chaos Club <{email_user}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=email_user,
            password=email_password,
        )
        return True
    except Exception as e:
        print(f"Error sending article alert to {to_email}: {e}")
        return False
