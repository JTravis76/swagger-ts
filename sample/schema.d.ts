/* eslint-disable */
/* tslint:disable */
// @ts-nocheck This file is auto-generated
/*
 * -----------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TS          ##
 * ## https://github.com/JTravis76/swagger-ts         ##
 * -----------------------------------------------------
 */
interface IVersionRequest {
  IncludeAllPages?: boolean;
  /** @format int32 */
  PageSize?: number;
  /** @format int32 */
  PageNumber?: number | null;
  Culture?: string | null;
  SortField?: string | null;
  SortOrder?: string | null;
}

interface IVersionResponse {
  Version: string | null;
  EnvironmentRegion: string | null;
  Environment: string | null;
  UserName: string | null;
}

interface IVersionResponse_v2 {
  Version: string | null;
  EnvironmentRegion: string | null;
  Environment: string | null;
}

interface IStatusResponse {
  Status: string | null;
}

interface IConnectedUsersResponse {
  /** @format int32 */
  ConnectedUsers: number;
  /** @format int32 */
  ConnectedRMQConsumers: number;
}

interface ILocationCameraRequest {
  IncludeAllPages?: boolean;
  /** @format int32 */
  PageSize?: number;
  /** @format int32 */
  PageNumber?: number | null;
  Culture?: string | null;
  SortField?: string | null;
  SortOrder?: string | null;
  /** @format int32 */
  LocationID?: number;
  CameraIDs?: number[] | null;
}

interface ILocationCameraResponse {
  IsSuccess: boolean;
  Message: string | null;
}

interface IAlertRulesFollowingRequest {
  Culture?: string | null;
  IncludeAllPages?: boolean;
  /** @format int32 */
  PageSize?: number;
  /** @format int32 */
  PageNumber?: number | null;
  SortField?: string | null;
  SortOrder?: string | null;
  Search?: string | null;
}

