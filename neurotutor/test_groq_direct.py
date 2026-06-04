import os
from groq import Groq
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {bool(api_key)}")
if api_key:
    print(f"Key prefix: {api_key[:10]}...")

try:
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "user", "content": "Hello! Say verify."}
        ],
        model="llama-3.1-8b-instant",
    )
    print("Success:")
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print("Groq Error:")
    print(e)
