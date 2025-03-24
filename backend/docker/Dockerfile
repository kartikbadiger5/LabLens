# Use official Python image
FROM python:3.12

# Set the working directory in the container
WORKDIR /app

# Copy everything to the container
COPY .. .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port FastAPI runs on
EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
