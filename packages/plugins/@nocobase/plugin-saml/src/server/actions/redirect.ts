import { Context } from '@nocobase/actions';

export const redirect = async (ctx: Context, next) => {
  const { params } = ctx.action;

  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
    </head>
    <body>
      <script>
        window.opener.postMessage(${JSON.stringify({
          authenticator: params.authenticator,
          samlResponse: params.values,
        })}, '*');
      </script>
    </body>
    </html>
  `;

  ctx.body = template;
  ctx.withoutDataWrapping = true;

  await next();
};
