import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customer-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-import.component.html',
  styleUrl: './customer-import.component.scss',
})
export class CustomerImportComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customer-import`;

  currentStep = signal<number>(1);
  isLoading = signal<boolean>(false);
  isImporting = signal<boolean>(false);

  selectedFile: File | null = null;
  previewRows = signal<any[]>([]);
  totalRows = signal<number>(0);
  validCount = signal<number>(0);
  errorCount = signal<number>(0);

  duplicateStrategy: 'SKIP' | 'UPDATE' | 'IMPORT_NEW' = 'SKIP';
  importSummary = signal<any | null>(null);
  importHistory = signal<any[]>([]);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.http.get<any>(`${this.API_URL}/history`).subscribe({
      next: (res) => this.importHistory.set(res.data || []),
    });
  }

  downloadTemplate(format: 'xlsx' | 'csv'): void {
    this.http
      .get(`${this.API_URL}/template?format=${format}`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAMIRA_Customer_Import_Template.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadAndPreview(file);
    }
  }

  uploadAndPreview(file: File): void {
    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${this.API_URL}/preview`, formData).subscribe({
      next: (res) => {
        this.previewRows.set(res.rows || []);
        this.totalRows.set(res.totalRows || 0);
        this.validCount.set(res.validCount || 0);
        this.errorCount.set(res.errorCount || 0);
        this.isLoading.set(false);
        this.currentStep.set(2);
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || 'Failed to parse spreadsheet file.');
      },
    });
  }

  confirmAndExecuteImport(): void {
    this.isImporting.set(true);
    this.http
      .post<any>(`${this.API_URL}/confirm`, {
        rows: this.previewRows(),
        duplicateStrategy: this.duplicateStrategy,
        fileName: this.selectedFile?.name || 'import.xlsx',
        fileSize: this.selectedFile?.size || 0,
      })
      .subscribe({
        next: (res) => {
          this.importSummary.set(res);
          this.isImporting.set(false);
          this.currentStep.set(4);
          this.loadHistory();
        },
        error: (err) => {
          this.isImporting.set(false);
          alert(err.error?.message || 'Import processing encountered a failure.');
        },
      });
  }

  downloadErrorReport(importId: string): void {
    this.http
      .get(`${this.API_URL}/${importId}/error-report`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAMIRA_Import_Errors_${importId}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  resetWizard(): void {
    this.selectedFile = null;
    this.previewRows.set([]);
    this.importSummary.set(null);
    this.currentStep.set(1);
  }
}
