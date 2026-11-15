import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiResponseInterceptor } from './api-response.interceptor';

describe('apiResponseInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiResponseInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('unwraps successful API envelopes once', () => {
    let result: unknown;
    http.get('/api').subscribe((response) => (result = response));

    httpTestingController.expectOne('/api').flush({
      success: true,
      statusCode: 200,
      data: { totalCustomers: 3 },
      timestamp: '2026-11-15T00:00:00.000Z',
    });

    expect(result).toEqual({ totalCustomers: 3 });
  });

  it('preserves pagination metadata while unwrapping the API envelope', () => {
    let result: unknown;
    http.get('/api').subscribe((response) => (result = response));
    const data = [{ id: 'customer-1' }];
    const meta = { total: 1, page: 1, limit: 10, totalPages: 1 };

    httpTestingController.expectOne('/api').flush({
      success: true,
      statusCode: 200,
      data,
      meta,
      timestamp: '2026-11-15T00:00:00.000Z',
    });

    expect(result).toEqual({ data, meta });
  });

  it('leaves already-unwrapped payloads unchanged', () => {
    const payload = { data: ['value'], meta: { total: 1 } };
    let result: unknown;
    http.get('/api').subscribe((response) => (result = response));

    httpTestingController.expectOne('/api').flush(payload);

    expect(result).toEqual(payload);
  });

  it('converts an unsuccessful response body to an HTTP error', () => {
    let result: HttpErrorResponse | undefined;
    http.get('/api').subscribe({ error: (error) => (result = error) });

    httpTestingController.expectOne('/api').flush({
      success: false,
      statusCode: 403,
      message: 'Insufficient permissions.',
      timestamp: '2026-11-15T00:00:00.000Z',
    });

    expect(result?.status).toBe(403);
    expect(result?.error.message).toBe('Insufficient permissions.');
  });

  it('preserves HTTP error status and body', () => {
    let result: HttpErrorResponse | undefined;
    http.get('/api').subscribe({ error: (error) => (result = error) });
    const errorBody = { message: 'Forbidden' };

    httpTestingController.expectOne('/api').flush(errorBody, {
      status: 403,
      statusText: 'Forbidden',
    });

    expect(result?.status).toBe(403);
    expect(result?.error).toEqual(errorBody);
  });
});
