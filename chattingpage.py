import streamlit as st
import requests, json, os, toml

# 加载API密钥
file_path = 'credentials'
if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        secrets = toml.load(f)
else:
    secrets = st.secrets

# # 检查secrets的结构并获取API密钥
if 'OPENROUTER' in secrets and 'OPENROUTER_API_KEY' in secrets['OPENROUTER']:
    OPENROUTER_API_KEY = secrets['OPENROUTER']['OPENROUTER_API_KEY']
else:
    raise KeyError("OPENROUTER_API_KEY not found in secrets. Please check your configuration.")

# 这个函数用于向OpenRouter API发送请求并获取回答
def answer(system_prompt, user_prompt):
    """
    向OpenRouter API发送包含系统提示和用户提示的消息,获取语言模型的回答。
    参数:
    system_prompt (str): 系统提示信息，用于引导语言模型的行为。
    user_prompt (str): 用户输入的问题或提示。
    返回: str: 语言模型的回答内容。
    """
    # 构建请求消息，包含系统和用户的角色及内容
    msg = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    response = requests.post(
        # OpenRouter API的聊天完成接口地址
        url="https://openrouter.ai/api/v1/chat/completions",
        # 设置请求头，包含授权信息
        headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
        # 将包含消息和模型信息的数据转换为JSON字符串后发送
        data=json.dumps({
            "messages": msg,
            "model": "openai/gpt-4o-mini-2024-07-18"
        })
    )
    # 从响应中提取语言模型的回答内容
    resp = response.json()['choices'][0]['message']['content']
    return resp

# 设置页面标题
st.title('Chat with GPT')

# 初始化聊天历史，用于存储对话记录
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
# 初始化用户问题，用于存储用户输入的当前问题
if 'user_question' not in st.session_state:
    st.session_state.user_question = ""
# 初始化回答，用于存储语言模型的当前回答
if 'response' not in st.session_state:
    st.session_state.response = ""

# 创建文件上传按钮（仅为展示，无实际上传功能）,允许用户选择文件
# 预留文件上传功能的页面布局，后续根据需要启用上传功能
uploaded_file = st.file_uploader("Choose an Excel file (.xlsx,.xls,.pdf,.doc,.docx)", type=['xlsx', 'xls', 'pdf', 'doc', 'docx'])

# 显示聊天记录
# 将聊天历史中的消息连接成一个HTML格式的字符串，以便在页面上展示
chat_history_str = "<br>".join([f"{msg}" if i % 2 == 0 or i == 0 else f"{msg}" for i, msg in enumerate(st.session_state.chat_history)])
st.markdown(chat_history_str, unsafe_allow_html=True)

# 创建文本输入框，用于用户输入问题
user_question = st.text_input("Enter your question here")
# 创建发送按钮，用于触发生成回答的操作
generate_response_button = st.button("Send")

# 当用户点击发送按钮且输入了问题时
if generate_response_button and user_question:
    # 设置系统提示，这里是一个简单的引导语言模型作为助手的提示
    system_prompt = "You are a helpful assistant."
    # 调用answer函数获取语言模型的回答
    response = answer(system_prompt, user_question)
    # 将用户问题和回答添加到聊天历史中
    st.session_state.chat_history.append(f"User: {user_question}")
    st.session_state.chat_history.append(f"AI: {response}")
    # 重新运行应用程序，以更新页面上的聊天记录显示
    st.rerun()
