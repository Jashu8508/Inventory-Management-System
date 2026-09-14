import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyA9Nqvek9OyRHw1Dl00XQxm916bMJ7W_mQ"
genai.configure(api_key=GEMINI_API_KEY)

model_name = "gemini-flash-latest"
try:
    print(f"Trying model: {model_name}")
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello")
    print(f"SUCCESS with {model_name}!")
    print(response.text)
except Exception as e:
    print(f"FAILED with {model_name}: {e}")
