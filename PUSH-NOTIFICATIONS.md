# Order notifications on Android and PC

The admin bell now registers this device for Web Push and sends a real server-side test. Permission alone is not shown as an active subscription. New saved orders trigger a push, and the service worker displays it even with the admin window closed. Foreground polling uses the same mobile-compatible worker notification and order tag, avoiding duplicate alerts. Signing out removes this device's subscription.

## Hosting setup (required once)

1. Generate keys once with `node scripts/setup-push.mjs https://YOUR-STORE-DOMAIN`.
2. Copy `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` from the ignored `.env.push.local` into the hosting service's environment settings, then redeploy. Use the same keys on all instances and keep them across deployments. Do not commit the private key. The generated file is not automatically loaded by the framework.
3. For Supabase, configure `SUPABASE_SERVICE_ROLE_KEY` on the server, never in a `NEXT_PUBLIC_` variable. The existing `settings` table must have a unique `key`. Block anonymous/browser access to these settings via RLS; subscriptions are private. SQLite, D1 and Turso use the existing settings table.
4. Open the HTTPS site in the installed app on each device, sign in, click the bell, and allow notifications. A test notification should arrive. The bell also retries setup and sends another test.
5. Close the app window and submit a test order. Check delivery on both devices. Windows/Android notification permission and battery/background restrictions still apply; a browser that is force-stopped cannot guarantee delivery.

Denied permissions, unsupported browsers, missing server settings, storage failures, and push service rejection appear in the admin instead of silently claiming success. Expired subscriptions are removed. Notification text includes an order reference only; customer contact details remain inside the admin.

Push delivery is best effort. This implementation awaits delivery attempts during order creation, with an eight-second timeout per push service. Failed attempts are logged without failing checkout; there is no durable retry queue. The service worker remembers the last 100 order notifications to suppress retries/foreground duplicates. Existing order persistence and authentication are unchanged.

## Checks

Run `node --test tests/push.test.cjs` and `npm run build`. Real Android/PC delivery must also be checked after configuring the production environment.
