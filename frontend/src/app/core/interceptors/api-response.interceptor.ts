import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { mergeMap, of } from 'rxjs';
import { ApiErrorResponse, ApiResponse } from '../models/api-response.model';

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<ApiResponse<unknown>>;
  return (
    response.success === true &&
    typeof response.statusCode === 'number' &&
    typeof response.timestamp === 'string' &&
    Object.prototype.hasOwnProperty.call(response, 'data')
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<ApiErrorResponse>;
  return response.success === false && typeof response.statusCode === 'number';
}

function unwrapResponse<T>(response: HttpResponse<T>): HttpEvent<unknown> {
  if (isApiErrorResponse(response.body)) {
    throw new HttpErrorResponse({
      error: response.body,
      status: response.body.statusCode,
      statusText: 'API Error',
      url: response.url ?? undefined,
    });
  }

  if (!isApiResponse(response.body)) return response;

  const { data, meta } = response.body;
  const body = meta === undefined ? data : { data, meta };
  return response.clone({ body });
}

export const apiResponseInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) =>
  next(req).pipe(
    mergeMap((event) => {
      if (!(event instanceof HttpResponse)) return of(event);
      return of(unwrapResponse(event));
    }),
  );
