from chatLLM import llm

class ChatBot:
    def __init__(self):
        self.chat_history = []
        self.user_question = ""
        self.response = ""

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

        system_prompt = (
            "You are a knowledgeable assistant. Based on the user's given topic, "
            "you should progressively expand the knowledge framework by asking questions "
            "and providing explanations. The knowledge framework should follow a hierarchical "
            "structure from broad concepts to detailed practical operations. For example:\n"
            "Topic A - Concept 1 - Practical steps a, b, c\n"
            "Topic A - Concept 2 - Practical steps a, b\n"
            "...\n"
            "Topic N - Concept k - Practical steps a, b, c\n"
            "Please provide a detailed and structured response."
            "This is your history of the conversation with the user, don't forget to follow "
            f"it up and continue answering the user's questions, chat history is as follows: {self.chat_history}" 
        )

        user_prompt = f"User question:\n{self.user_question}"

        self.response = llm.answer(system_prompt, user_prompt)
        self.chat_history.append(f"AI: {self.response}")
        return self.response

    def get_chat_history(self):
        """Return the chat history."""
        return self.chat_history

    def get_last_response(self):
        """Return the last response from the bot."""
        return self.response

# Example usage
if __name__ == "__main__":
    bot = ChatBot()
    bot.add_user_question("What is the capital of France?")
    response = bot.generate_response()
    print(response)
    print(bot.get_chat_history())