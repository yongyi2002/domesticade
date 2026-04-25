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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing OPENAI_API_KEY environment variable' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const imageDataUrl = body.imageDataUrl;

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing imageDataUrl' })
      };
    }

    const prompt = [
      'You are a game level designer for a stylized AR platformer.',
      'Analyze the REAL visible objects and surfaces in the photo and convert them into game obstacles that preserve the scene character.',
      'Do not generate a generic level template. Different photos should produce meaningfully different obstacle sets.',
      'Only include obstacles that are clearly grounded in visible objects, edges, surfaces, supports, clutter, or hazards from the image.',
      'Return only valid JSON.',
      'The JSON must contain an "obstacles" array.',
      'Each obstacle object must include:',
      '- type: a short english noun for the transformed game object',
      '- source_object: the real object or surface this came from, like "desk edge", "chair leg", "cable", "monitor stand"',
      '- asset_kind: one of "grass", "brick", "pipe", "ramp", "trap"',
      '- course_role: one of "path", "hazard", "scenery", "goal"',
      '- x: estimated relative horizontal position from -1.5 to 1.5 based on the photo (left negative, right positive)',
      '- z: estimated relative depth position from -1.5 to 1.5 based on the photo (closer to camera larger z if that matches the image)',
      '- scale: estimated obstacle size from 0.5 to 2.0 based on the object size in the photo',
      '- theme_hint: a short stylized game-asset description string that matches the obstacle style',
      '- placement_reason: one short sentence explaining why this object becomes that obstacle',
      'Preserve scene-specific structure. Example mappings:',
      '- flat tabletop, shelf, or broad ledge -> grass or brick path',
      '- bottle, cup, or cylindrical leg -> pipe',
      '- slanted support or leaning object -> ramp',
      '- cable, sharp clutter, unstable edge, or dangerous obstruction -> trap',
      '- background or side object that should enrich the scene but not block progress -> scenery',
      'Prefer 4 to 10 obstacles when possible.',
      'For floors, tables, desks, counters, or other large horizontal surfaces: include several course_role "path" obstacles whose x,z lie along ONE traversable line across that surface (like stepping stones), with similar scale so they read as one continuous walkable route.',
      'Place course_role "goal" at the far end of that route on the same surface when possible.',
      'Make sure the mix depends on the actual photo, not on a fixed pattern.'
    ].join(' ');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      let message = (errorText || '').trim() || 'OpenAI request failed';
      try {
        const errJson = JSON.parse(errorText);
        if (errJson && errJson.error && typeof errJson.error.message === 'string') {
          message = errJson.error.message;
        }
      } catch (_) {
        /* keep raw message */
      }
      return {
        statusCode: openaiResponse.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: message, openai_status: openaiResponse.status })
      };
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData &&
      openaiData.choices &&
      openaiData.choices[0] &&
      openaiData.choices[0].message &&
      openaiData.choices[0].message.content;

    if (!content) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Empty OpenAI response content' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: content
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Unexpected server error' })
    };
  }
};
