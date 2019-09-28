import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

import { API_BASE_URL } from './constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  public getMidiFiles(): any {
    const path = Location.joinWithSlash(API_BASE_URL, '/api/midi/files');
    return this.http.get(path);
  };

  public getMidiFile(filename: string): any {
    const path = Location.joinWithSlash(API_BASE_URL, `/api/midi/file/${filename}`);
    return this.http.get(path, { responseType: 'text' });
  }

  public uploadMidiFile(file: File): Observable<any> {
    const uploadUrl = Location.joinWithSlash(API_BASE_URL, "/api/midi/upload");
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({ 'enctype': 'multipart/form-data' });

    return this.http.post(uploadUrl, formData, { headers: headers });
  }
}
