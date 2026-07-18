FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    OSINT_DATA_DIR=/data \
    PATH="/opt/recon-ng:/opt/GhostTrack:${PATH}"

# --- System packages ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl wget git jq unzip \
    python3 python3-pip python3-venv python3-dev \
    build-essential libffi-dev libssl-dev \
    nginx supervisor \
    nmap whois dnsutils netbase \
    libimage-exiftool-perl whatweb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/osint

# --- Outils Go (binaires release, go install echoue sur TruffleHog >= 1.25) ---
COPY scripts/install-go-binaries.sh /opt/osint/scripts/install-go-binaries.sh
RUN chmod +x /opt/osint/scripts/install-go-binaries.sh \
    && /opt/osint/scripts/install-go-binaries.sh

# --- PhoneInfoga (binaire release, go install echoue sans assets web) ---
ARG PHONEINFOGA_VERSION=2.11.0
RUN ARCH="$(dpkg --print-architecture)" \
    && case "$ARCH" in \
      amd64) PI_ARCH="Linux_x86_64" ;; \
      arm64) PI_ARCH="Linux_arm64" ;; \
      *) echo "Unsupported arch for phoneinfoga: $ARCH" && exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/sundowndev/phoneinfoga/releases/download/v${PHONEINFOGA_VERSION}/phoneinfoga_${PI_ARCH}.tar.gz" -o /tmp/phoneinfoga.tgz \
    && tar -xzf /tmp/phoneinfoga.tgz -C /usr/local/bin phoneinfoga \
    && chmod +x /usr/local/bin/phoneinfoga \
    && rm /tmp/phoneinfoga.tgz

# --- ttyd ---
ARG TTYD_VERSION=1.7.7
RUN ARCH="$(dpkg --print-architecture)" \
    && case "$ARCH" in \
      amd64) TTYD_ARCH="x86_64" ;; \
      arm64) TTYD_ARCH="aarch64" ;; \
      *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_ARCH}" -o /usr/local/bin/ttyd \
    && chmod +x /usr/local/bin/ttyd

# --- Python OSINT tools ---
RUN pip3 install --no-cache-dir \
    sherlock-project \
    maigret \
    theHarvester \
    holehe \
    socialscan \
    ghunt \
    h8mail \
    social-analyzer \
    waybackpy \
    snscrape \
    "yente-client[cli]"

# --- Blackbird ---
RUN git clone --depth 1 https://github.com/p1ngul1n0/blackbird.git /opt/blackbird \
    && pip3 install --no-cache-dir -r /opt/blackbird/requirements.txt

# --- Recon-ng ---
RUN git clone --depth 1 https://github.com/lanmaster53/recon-ng.git /opt/recon-ng \
    && pip3 install --no-cache-dir -r /opt/recon-ng/REQUIREMENTS \
    && ln -sf /opt/recon-ng/recon-ng /usr/local/bin/recon-ng

# --- GhostTrack ---
RUN git clone --depth 1 https://github.com/HunxByts/GhostTrack.git /opt/GhostTrack \
    && pip3 install --no-cache-dir "urllib3<2" \
    && pip3 install --no-cache-dir -r /opt/GhostTrack/requirements.txt

# --- SpiderFoot ---
RUN git clone --depth 1 https://github.com/smicallef/spiderfoot.git /opt/spiderfoot \
    && sed -i "s|'root': '/'|'root': '/spiderfoot'|" /opt/spiderfoot/sf.py \
    && pip3 install --no-cache-dir -r /opt/spiderfoot/requirements.txt

# --- Social Analyzer (interface web) ---
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && git clone --depth 1 https://github.com/qeeqbox/social-analyzer.git /opt/social-analyzer \
    && cd /opt/social-analyzer && npm ci --omit=dev

# --- References OSINT (awesome-osint + scripts collection) ---
RUN git clone --depth 1 https://github.com/jivoi/awesome-osint.git /opt/osint/awesome-osint \
    && git clone --depth 1 https://github.com/cipher387/osint_stuff_tool_collection.git /opt/osint/scripts-collection

# --- theHarvester (the PyPI "theHarvester" package is a broken 0.0.1 stub on
#     Python 3.10; install the real project from git and its full dep set) ---
RUN pip3 install --no-cache-dir "git+https://github.com/laramies/theHarvester.git@4.4.4" \
    && pip3 install --no-cache-dir ujson aiodns aiofiles aiosqlite aiomultiprocess \
       fastapi uvicorn uvloop censys dnspython shodan slack-sdk retrying netaddr \
       plotly beautifulsoup4 lxml python-dateutil PyYAML requests certifi aiohttp pyppeteer

# --- Dashboard ---
COPY dashboard/requirements.txt /opt/osint/dashboard/requirements.txt
RUN pip3 install --no-cache-dir -r /opt/osint/dashboard/requirements.txt
COPY dashboard/ /opt/osint/dashboard/

# --- Runtime config ---
COPY scripts/update-tools.sh /opt/osint/scripts/update-tools.sh
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/supervisord.conf /etc/supervisor/conf.d/osint-labs.conf
COPY scripts/entrypoint.sh /entrypoint.sh

RUN mkdir -p /data/projects /var/log/osint-labs \
    && chmod +x /entrypoint.sh /opt/osint/scripts/update-tools.sh \
    && ln -sf /data /opt/osint/cases

VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
