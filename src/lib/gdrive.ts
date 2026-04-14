import { google } from "googleapis";

export const getDriveService = () => {
  const email = process.env.GDRIVE_CLIENT_EMAIL;
  const key = process.env.GDRIVE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error("Kredensial Google Drive (GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY) belum dikonfigurasi di .env");
  }

  const credentials = {
    client_email: email,
    // Pastikan multiline private key terbaca dengan benar
    private_key: key.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    // Scope membatasi hak akses file hanya untuk file yang di-upload oleh aplikasi ini
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
};
