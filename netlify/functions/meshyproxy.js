const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing MESHY_API_KEY environment variable' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    if (body.prompt) {
      const createResponse = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'preview',
          prompt: body.prompt,
          model_type: 'lowpoly',
          target_formats: ['glb'],
          should_remesh: false
        })
      });

      const createText = await createResponse.text();
      if (!createResponse.ok) {
        return {
          statusCode: createResponse.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: createText || 'Meshy create task failed' })
        };
      }

      const createData = JSON.parse(createText || '{}');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          task_id: createData.result || createData.id || null,
          raw: createData
        })
      };
    }

    if (body.task_id) {
      const statusResponse = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${encodeURIComponent(body.task_id)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const statusText = await statusResponse.text();
      if (!statusResponse.ok) {
        return {
          statusCode: statusResponse.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: statusText || 'Meshy status request failed' })
        };
      }

      const statusData = JSON.parse(statusText || '{}');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          task_id: statusData.id || body.task_id,
          status: statusData.status || 'UNKNOWN',
          progress: statusData.progress || 0,
          model_urls: statusData.model_urls || null,
          glb_url: statusData.model_urls && statusData.model_urls.glb ? statusData.model_urls.glb : null,
          task_error: statusData.task_error || null
        })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body must include prompt or task_id' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Unexpected server error' })
    };
  }
};
