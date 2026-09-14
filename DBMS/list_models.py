import google.generativeai as genai
import os

GEMINI_API_KEY = "AIzaSyA9Nqvek9OyRHw1Dl00XQxm916bMJ7W_mQ"
genai.configure(api_key=GEMINI_API_KEY)

print("Available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
