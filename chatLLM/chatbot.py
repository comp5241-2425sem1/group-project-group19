import os
from chatLLM import llm

class ChatBot:
    def __init__(self, topic, jobDescription, experienceLevel):
        self.chat_history = []
        self.user_question = ""
        self.response = ""
        self.topic = topic
        self.jobDescription = jobDescription
        self.experienceLevel = experienceLevel

    def clear_history(self):
        """Clear the chat history and reset user question and response."""
        self.chat_history = []
        self.user_question = ""
        self.response = ""

    def add_user_question(self, question):
        """Add a user question to the chat history."""
        self.user_question = question
        self.chat_history.append(f"User: {question}")

    def generate_response(self):
        """Generate a response using the llm.answer method and update the chat history."""
        if not self.user_question:
            return "Please enter a question."

        system_prompt = self.load_system_prompt()

        user_prompt = f"User question:\n{self.user_question}"

        self.response = llm.answer(system_prompt, user_prompt)
        self.chat_history.append(f"AI: {self.response}")
        return self.response

    def load_system_prompt(self):
        """Load the system prompt from a text file and format it with the current context."""
        current_dir = os.path.dirname(__file__)
        file_path = os.path.join(current_dir, 'system_prompt.txt')
        with open(file_path, 'r') as file:
            system_prompt = file.read()

        # Format the system prompt with the current context
        system_prompt = system_prompt.format(
            Topic=self.topic,
            Level=self.experienceLevel,  # You can adjust this as needed
            job_description=self.jobDescription,
            chat_history=self.chat_history
        )

        return system_prompt

    def get_chat_history(self):
        """Return the chat history."""
        return self.chat_history

    def get_last_response(self):
        """Return the last response from the bot."""
        return self.response

# Example usage
if __name__ == "__main__":
    bot = ChatBot(topic="Artificial Intelligence", jobDescription="Develop AI models", experienceLevel="Intermediate")
    bot.add_user_question("What is the capital of France?")
    response = bot.generate_response()
    print(response)
    print(bot.get_chat_history())