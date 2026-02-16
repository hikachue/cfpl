import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export class GoogleSheetsClient {
    private static instance: GoogleSheetsClient;
    private authClient: any = null;
    private spreadsheetId: string;

    private constructor() {
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "";

        // Check if we are running in a build environment or without credentials
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            console.warn("Google Sheets credentials not found. Client will not authorize.");
            return;
        }

        // Handle private key newlines (often an issue in env vars)
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

        this.authClient = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: SCOPES,
        });
    }

    public static getInstance(): GoogleSheetsClient {
        if (!GoogleSheetsClient.instance) {
            GoogleSheetsClient.instance = new GoogleSheetsClient();
        }
        return GoogleSheetsClient.instance;
    }

    public async getSheetsService() {
        if (!this.authClient) {
            throw new Error("Google Sheets client is not authenticated. Check environment variables.");
        }
        // Authorize explicitly? Not strictly needed with google.sheets({ auth }) but good for checking.
        // await this.authClient.authorize();

        return google.sheets({ version: "v4", auth: this.authClient });
    }

    public getSpreadsheetId(): string {
        if (!this.spreadsheetId) {
            throw new Error("GOOGLE_SPREADSHEET_ID is not set.");
        }
        return this.spreadsheetId;
    }
}
