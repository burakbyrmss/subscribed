// Utility function to generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Utility function to get current datetime in ISO format
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

// Utility function to get current date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}
