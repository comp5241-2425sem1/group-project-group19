import streamlit as st
import pandas as pd
import llm
from PyPDF2 import PdfReader
import docx
import zipfile

# Set the page title
st.title('Chat with FAQ Bot')

# Initialize chat history
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'user_question' not in st.session_state:
    st.session_state.user_question = ""
if 'response' not in st.session_state:
    st.session_state.response = ""
faq_text = None

# Create a file upload control that allows users to upload Excel files
uploaded_file = st.file_uploader("Choose an Excel file (.xlsx, .xls, .pdf, .doc, .docx)", type=['xlsx', 'xls', 'pdf', 'doc', 'docx'])

# Check if any files have been uploaded
if uploaded_file is not None:
    try:
        # Process the uploaded file based on its type
        if uploaded_file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" or uploaded_file.type == "application/vnd.ms-excel":
            # Read Excel file and convert to data box
            df = pd.read_excel(uploaded_file)
            if df.empty:
                    uploaded_file = None
                    st.error("The uploaded file is empty")
            else:
            # Show the data box
                st.dataframe(df)
                faq_text = df.to_string(index=False)
        elif uploaded_file.type == "application/pdf":
            # Read PDF file
            pdf_reader = PdfReader(uploaded_file)
            faq_text = ""
            if pdf_reader.is_encrypted:
                pdf_reader.decrypt("")  # Provide the password if needed
            for page in pdf_reader.pages:
                faq_text += page.extract_text()
            if not faq_text.strip():
                st.error("The uploaded PDF file is empty")
                uploaded_file = None
        elif uploaded_file.type == "application/msword" or uploaded_file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            # Read Word file
            doc = docx.Document(uploaded_file)
            faq_text = ""
            for para in doc.paragraphs:
                faq_text += para.text + "\n"
                if not faq_text.strip():
                    st.error("The uploaded Word file is empty")
                    uploaded_file = None
        else:
            st.error("Unsupported file type")
            faq_text = ""
    except zipfile.BadZipFile:
        st.error("File is not a zip file or is corrupted")
        uploaded_file = None

    # Create a text input for the user to enter a question
user_question = st.text_input("Enter your question here")
generate_response_button = st.button("Send")

    # Add a button to clear chat history
clear_history_button = st.button("New Chat")


# response = llm.answer(system_prompt, user_prompt)

    # Check if the user has entered a question
if generate_response_button and user_question:
    if uploaded_file is None:
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
                f"it up and continue answering the user's questions, chat history is as follows: {st.session_state.chat_history}" 
            )
    else:
        system_prompt = (
                "You are a knowledgeable assistant. Based on the user's given topic, "
                "you should progressively expand the knowledge framework by asking questions "
                "and providing explanations. The knowledge framework should follow a hierarchical "
                "structure from broad concepts to detailed practical operations. For example:\n"
                "Topic A - Concept 1 - Practical steps a, b, c\n"
                "Topic A - Concept 2 - Practical steps a, b\n"
                "...\n"
                "Topic N - Concept k - Practical steps a, b, c\n"
                "Please provide a detailed and structured response.\n\n"
                "This is the document uploaded by the user.If the user asks about the document, "
                f"answer any questions about the document. \n\nThe document:\n\n{faq_text}\n\n"
                "Note: This is your history of the conversation with the user, don't forget to follow "
                f"it up and continue answering the user's questions, chat history is as follows:\n{st.session_state.chat_history}" 
            )
    user_prompt = f"User question:\n{user_question}"

    response = llm.answer(system_prompt, user_prompt)
    # response = "success"

        # Update chat history
    st.session_state.chat_history.append(f"User: {user_question}")
    st.session_state.chat_history.append(f"AI: {response}")

    # Display updated chat history
hello = "AI: Hello! I am a a knowledgeable assistant. Give me a topic, and I will provide you with a detailed and structured response."
st.markdown(hello, unsafe_allow_html=True)
chat_history_str = "<br>".join([f"{msg}" if i % 2 == 0 or i == 0 else f"{msg}" for i, msg in enumerate(st.session_state.chat_history)]) 
st.markdown(chat_history_str, unsafe_allow_html=True)

if clear_history_button:
    st.session_state.chat_history = []
    st.session_state.user_question = ""
    st.session_state.response = ""
    uploaded_file = None
    st.rerun()


