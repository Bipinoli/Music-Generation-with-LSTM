import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { AI_API_URL } from './constants';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class APIService {

  constructor(private http: HttpClient) { }

  public getAllInformation() {
    const url = Location.joinWithSlash(AI_API_URL, "/api/v1/information/all")
    return this.http.get(url);
  }

  public generateMusic(options: any) {
    const url = Location.joinWithSlash(AI_API_URL, "/api/v1/generate");
    return this.http.post(url, options);
  }

  public modifyMusic(options: any) {
    const url = Location.joinWithSlash(AI_API_URL, "/api/v1/modify");
    return this.http.post(url, options);
  }

  public getPdfSrc(pdfUrl: string): Observable<string> {
    const url = Location.joinWithSlash(AI_API_URL, "/api/v1/sheet_music/pdf");
    const headers = new HttpHeaders();
    headers.set("Accept", "application/pdf");
    return this.http.get(url, {headers: headers, responseType: 'blob'})
      .pipe(
        map((blob: Blob) => <string>URL.createObjectURL(blob)),
      );
  }
}
