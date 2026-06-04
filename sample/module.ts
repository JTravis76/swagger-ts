/* == module.ts ==
 * This sample module is used to demostrate how to use the generated controller from swagger-ts.
 * It is also a great way to test out the controller for proper syntax usage.
 */
import controller from "./controller";

// controller.Version.v1.GetVersion({}).then((d) => console.log(d));

// const data = await controller.Version.v2.GetVersion({});

// controller.Video.v1.SubscribedAlertRuleNotificationByUser({}).then(() => console.log(""));

// controller.SuperAdmin.v1.SetCamerasForLocation({});

controller.authenticate.v1.signin({})
controller.cameras.v1.delete(0);
controller.cameras.v1.get(10, 1, null, true, null);
controller.company.v1.get(10, 1);