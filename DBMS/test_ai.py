import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyA9Nqvek9OyRHw1Dl00XQxm916bMJ7W_mQ"
genai.configure(api_key=GEMINI_API_KEY)

models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro", "gemini-1.5-flash-latest"]

for model_name in models_to_try:
    try:
        print(f"Trying model: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS with {model_name}!")
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {e}")
