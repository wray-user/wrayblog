const DEFAULT_TIMEOUT_MS = 5000;

const buildHookPayload = (message, options = {}) => {
  const payload = {
    message,
    deliver: options.deliver !== false,
    channel: options.channel || process.env.OPENCLAW_NOTIFY_CHANNEL || 'last',
    sessionKey: options.sessionKey || 'wrayblog-monitor',
  };

  const agentId = options.agentId || process.env.OPENCLAW_NOTIFY_AGENT_ID;
  const to = options.to || process.env.OPENCLAW_NOTIFY_TO;

  if (agentId) {
    payload.agentId = agentId;
  }

  if (to) {
    payload.to = to;
  }

  return payload;
};

const sendOpenClawMessage = async (message, options = {}) => {
  const url = process.env.OPENCLAW_HOOK_URL;
  const token = process.env.OPENCLAW_HOOK_TOKEN;

  if (!url || !token || !message) {
    return { skipped: true };
  }

  if (typeof fetch !== 'function') {
    console.warn('OpenClaw notification skipped: global fetch is unavailable. Use Node 18+.');
    return { skipped: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OPENCLAW_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildHookPayload(message, options)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn(`OpenClaw notification failed: ${response.status} ${detail}`);
      return { ok: false, status: response.status, detail };
    }

    return { ok: true };
  } catch (error) {
    console.warn(`OpenClaw notification failed: ${error.message}`);
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  sendOpenClawMessage,
};
