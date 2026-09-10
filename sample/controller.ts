/* eslint-disable */
/* tslint:disable */
// @ts-nocheck This file is auto-generated
/*
 * -----------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TS          ##
 * ## https://github.com/JTravis76/swagger-ts         ##
 * -----------------------------------------------------
 */
import type { AxiosRequestConfig } from 'axios';
import httpClient from './httpClient';

// prettier-ignore
export default {
  Version: {
    v1: {
      GetVersion: (payload: IVersionRequest, config?: AxiosRequestConfig) => httpClient.post<IVersionResponse>(`/api/v1/Version/GetVersion`, payload, config),
    },
  },
}
