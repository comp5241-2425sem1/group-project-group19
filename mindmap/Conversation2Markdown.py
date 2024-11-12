import requests, json, os, toml

# Load API key from credentials.txt
current_dir = os.path.dirname(__file__)
file_path = os.path.join(current_dir, 'credentials')
if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        secrets = toml.load(f)

OPENROUTER_API_KEY = secrets['OPENROUTER']['OPENROUTER_API_KEY']

def answer(system_prompt, user_prompt): 
    msg = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt} ]
    
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions", 
        headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"}, 
        data=json.dumps({
            "messages": msg,
            "model": "openai/gpt-4o-mini-2024-07-18" 
            })
    )
    resp = response.json()['choices'][0]['message']['content'] 
    return resp

def get_result(user_content):

    prompt_path = os.path.join(current_dir, 'prompt.txt')
    if os.path.exists(prompt_path):
        with open(prompt_path, 'r') as file:
            system_prompt = file.read()
    else:
        print(f"File {prompt_path} does not exist.")
        return

    result = answer(system_prompt, user_content)
    return result

def generate_summary(markdown):
    system_prompt = "请根据以下Markdown内容生成总结和建议："
    user_prompt = markdown
    summary = answer(system_prompt, user_prompt)
    return summary