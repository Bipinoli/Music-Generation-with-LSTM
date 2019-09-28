import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { APIService } from '../api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent implements OnDestroy {

  public pdfSrc: string = "";
  public pdfUrl: string = "";
  // public safePdfUrl: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<PdfViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {pdfUrl: string},
    public apiService: APIService,
    // public sanitizer: DomSanitizer,
  ) { 
    this.pdfUrl = data.pdfUrl;
    // this.safePdfUrl = sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
    // this.apiService.getPdfSrc(this.pdfUrl)
    //   .subscribe((pdfSrc: string) => this.pdfSrc = pdfSrc);
  }

  ngOnDestroy() {
    console.log("PDF reference destroyed, memory free!!");
    URL.revokeObjectURL(this.pdfSrc);
  }

}
