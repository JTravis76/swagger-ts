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
      GetVersion: (payload: IVersionRequest, config?: AxiosRequestConfig) => httpClient.post<IVersionResponse>(`/api/Version/GetVersion`, payload, config),
    },
    v2: {
      GetVersion: (payload: IVersionRequest, config?: AxiosRequestConfig) => httpClient.post<IVersionResponse_v2>(`/api/v2/Version/GetVersion`, payload, config),
    },
  },
  Status: {
    v1: {
      Get: (config?: AxiosRequestConfig) => httpClient.get<IStatusResponse>(`/api/Status/Get`, config),
      GetDB: (config?: AxiosRequestConfig) => httpClient.get<string>(`/api/Status/GetDB`, config),
      GetConnectedStats: (config?: AxiosRequestConfig) => httpClient.get<IConnectedUsersResponse>(`/api/Status/GetConnectedStats`, config),
      GetServerRegion: (config?: AxiosRequestConfig) => httpClient.get<string>(`/api/Status/GetServerRegion`, config),
      CompanyLicenseVersion: (config?: AxiosRequestConfig) => httpClient.get<string>(`/api/Status/CompanyLicenseVersion`, config),
    },
  },
  SuperAdmin: {
    v1: {
      /** @deprecated */
      SetCamerasForLocation: (payload: ILocationCameraRequest, config?: AxiosRequestConfig) => httpClient.post<ILocationCameraResponse>(`/api/SuperAdmin/SetCamerasForLocation`, payload, config),
    },
  },
  Video: {
    v1: {
      /** @deprecated */
      SubscribedAlertRuleNotificationByUser: (payload: IAlertRulesFollowingRequest, config?: AxiosRequestConfig) => httpClient.post<number>(`/api/Video/SubscribedAlertRuleNotificationByUser`, payload, config),
    },
  },
}
