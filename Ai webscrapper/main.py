import streamlit as st
from scrape import scrape_website

st.title("AI Web Scraper")
url = st.text_input("Enter the URL to scrape:")

if st.button("Scrape"):
    st.write("Scraping data...")
    result = scrape_website(url)
    st.write(result)