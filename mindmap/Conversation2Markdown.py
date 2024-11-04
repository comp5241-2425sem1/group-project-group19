import requests, json, os, toml

# Load API key from credentials.txt
current_dir = os.path.dirname(__file__)
file_path = os.path.join(current_dir, 'credentials.txt')
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

def get_result():
    # 从用户处获取粘贴的内容
    #user_content = input("请粘贴内容：")
    user_content = """
在讨论“网站规划与推广营销进度”时，可以从网站的实施阶段和推广计划两个方面进行深入分析。

网站规划与推广营销的结构
开发阶段
概念: 这是网站的整体开发和测试阶段。
目标: 在现有的基础上完成网站的功能开发和优化。
时间框架: 该阶段预计在三个月内完成，包括必要的测试。
实际步骤:
a. 确定网站功能和需求。
b. 开发和实现各种功能模块。
c. 进行内部测试和用户测试，以确保网站的正常运作。
运营阶段
概念: 网站上线后的维护与更新阶段。
目标: 确保网站的平稳运行，并及时处理用户反馈和问题。
实际步骤:
a. 定期进行网站内容更新。
b. 维护服务器的稳定性和安全性。
c. 回应用户咨询和投诉，确保用户满意度。
推广阶段
概念: 根据推广计划进行市场推广，吸引注册用户。
目标: 三个月内达到100万的注册用户目标。
实际步骤:
a. 开展内容营销，发布高质量的文章来吸引用户点击。
b. 在社交媒体和相关社区进行宣传。
c. 计划和执行线下活动以增强用户互动。
业务阶段
概念: 转向盈利和持续扩展的阶段。
目标: 实现多种盈利模式的突破。
实际步骤:
a. 招募业务员寻找合作商家。
b. 推广平台上的各类产品和服务。
c. 制定长远的业务拓展计划。
向前推进的关键策略
用户研究: 在推广前进行用户调查，了解目标用户的需求和偏好，以便制定更精准的营销策略。
SEO优化: 确保网站具备良好的搜索引擎优化，提升在搜索引擎中的排名，吸引自然流量。
数据分析: 使用分析工具监测用户行为和网站流量，根据数据反应适时调整推广策略。
是否您有某个特定阶段或实际操作想要更深入了解的呢？


"""



    # 从文件中读取系统提示词
    prompt_path = os.path.join(current_dir, 'prompt.txt')
    if os.path.exists(prompt_path):
        with open(prompt_path, 'r') as file:
            system_prompt = file.read()
    else:
        print(f"File {prompt_path} does not exist.")
        return


    # 调用 llm.py 中的 answer 函数
    result = answer(system_prompt, user_content)
    return result
