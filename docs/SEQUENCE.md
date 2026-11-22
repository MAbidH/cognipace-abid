# The sequence - cognipace-abid (19 Nov 2026)

Six phases, Dec 2026 - May 2027, 20+ h/week. The order does not move; dates do. A module is written 4-6 weeks ahead;
below the line, outlines only. Each FIN module comes after the technical module it builds on.

## Written (curriculum/modules.json, 62 steps)
| # | Module | Phase | Weeks | Closes on |
|---|---|---|---|---|
| 1 | SETUP1 Setup: machine, tools, public record (Windows; TryHackMe in the browser) | 0 | 1 | repo public, toolchain versions, first room, docs read |
| 2 | PY1 Python I: values -> functions; password checker v0 | 1 | 2-3 | 14-skill checkpoint 80%; pwcheck.py committed |
| 3 | FIN1 Money and banking systems (ledger.py; Canadian rails; CDIC) | 1 | 4 | 9-skill checkpoint; ledger with invariant |
| 4 | PY2 Python II: files, exceptions, stdlib; authparse, fim, report | 1 | 5 | 14-skill checkpoint; three tools committed |
| 5 | LNX1 Linux I in the browser and over ssh: Bandit 0-20, THM rooms | 1 | 6 | Bandit 21; write-ups; 14-skill checkpoint |
| 6 | FIN2 Markets and trading mechanics (paper): orderbook.py, journal | 2 | 7 | engine + tests; journal; 12-skill checkpoint |

## Outlines (to write in December/January, in this order)
- **LNX2 Linux II on the second laptop** (wk 8): Ubuntu 24.04 bare-metal install; users/sudo; ufw; ssh keys +
  hardening (no password auth, fail2ban); systemd units; journald; apt; the lab folder; FIM v1 running on it as a
  timer. Gate: a hardened, documented laptop; `ssh` from the PC to it with keys only.
- **NET1 Networking I** (wk 8-9): OSI/TCP-IP, IP and subnetting (90% test), ARP/DHCP/DNS, TCP handshake, UDP, ports;
  Wireshark reads on his own traffic; `ss`, `ip`, `dig`, `curl -v`. Build: a DNS lookup tool, a packet-capture
  summariser in Python (scapy or pyshark on captures from his own lab).
- **PY3 Python III: sockets, HTTP, classes** (wk 9-10): socket client/server on the lab; requests + an API (GitHub,
  THM); argparse tools with classes; concurrency (threads) for the scanner; tests with pytest. Build: port scanner
  (own lab only), HTTP header checker.
- **NET2 Networking II: TLS and the web** (wk 10): HTTP/1.1 and 2, TLS handshake read in Wireshark, certificates and
  chains (`openssl s_client`, x509), HSTS/CSP headers; nmap on the lab; ufw/iptables rules. Build: TLS cert chain
  verifier in Python (cryptography lib).
- **FIN3 Fintech and regulation (Canada)** (wk 11): OSFI (Bank Act, B-10 third-party risk, B-13 technology and cyber
  risk - read them), FINTRAC/PCMLTFA (KYC/AML, reporting entities, MSBs and crypto dealers), CSA (securities, the
  crypto trading platform regime), Payments Canada/Bank of Canada (RPAA for payment service providers, 2024-25),
  open banking/consumer-driven banking timeline. Build: a compliance-mapping brief for a hypothetical payments app.
- **SEC1 Security+ core I** (wk 11-13): threats/attacks/vulnerabilities, malware classes, social engineering,
  architecture (zero trust, segmentation, cloud), identity (AAA, MFA, PKI, federation). Windows basics in a lab VM
  on the laptop (AD concepts, PowerShell). Practice exams begin (target 85%).
- **SEC2 Security+ core II: operations and governance** (wk 14-16): logging and SIEM (Wazuh on the Pi/laptop with his
  FIM and auth logs feeding it), IR process, forensics basics, vulnerability management, hardening baselines;
  governance, risk, compliance (his BBA), frameworks (NIST CSF, ISO 27001), policies. Build: a hardened lab with
  Wazuh, an IR playbook, a risk register for his own lab. Book the exam for ~week 18; sit it when practice >= 85%.
- **CRY1 Cryptography I: the maths and the primitives** (wk 17-18): modular arithmetic, XOR, primes, discrete log
  idea; hashes/HMAC; AES and modes (why ECB fails - he shows it on a bitmap); password hashing (bcrypt/argon2);
  randomness (secrets vs random). Build: toy implementations and breaks in Python; Cryptopals set 1.
- **CRY2 Cryptography II: public key, signatures, TLS end to end** (wk 19-20): RSA and ECC mechanics, Diffie-Hellman,
  ECDSA, certificates and chains, TLS 1.3 handshake, key management. Build: verify a chain by hand; a file-encryption
  tool done right (AES-GCM + argon2); Cryptopals set 2. Gate: explain TLS end to end.
- **FIN4 Digital assets as applied cryptography** (wk 20): Bitcoin (UTXO, PoW, difficulty, keys and addresses) and
  Ethereum (accounts, gas, EVM, PoS) as systems; wallets and seed phrases (never typed anywhere); exchanges vs
  self-custody; stablecoin mechanics (fiat-backed, overcollateralised, algorithmic - and Terra's failure). Build:
  web3.py on Sepolia - read blocks, balances, a contract's storage; send a testnet transaction from a throwaway key.
- **WEB1 Web security basics** (wk 21-22): OWASP Top 10 on DVWA/Juice Shop in his lab; auth done right (sessions,
  cookies, CSRF, password storage); input validation; SQLi/XSS mechanics and defences. Build: a Flask app with auth
  done right + its threat model; detection rules (Sigma) for his SIEM.
- **FIN5 Tokenization** (wk 22-23): tokenized deposits vs stablecoins vs CBDC (who owes you the money - FIN1
  again); the Canadian pilots (banks, Project Jasper/Helvetia lineage, BIS unified-ledger papers); RWA tokenization
  (bonds, funds, real estate) and what settlement on a ledger changes (T+0, DvP atomicity, netting lost); securities
  law questions (CSA), custody, smart-contract risk. Build: a tokenization brief he could hand to a bank (8-10 pages).
- **FIN6 DeFi security** (wk 23-24): AMMs vs order books (FIN2), lending protocols and liquidations (FIN2 margin),
  bridges, oracles; the exploit classes (reentrancy, flash loans, oracle manipulation, key compromise) each paired
  with the defence; reading an audit report. Build: analyse two historical incidents from primary post-mortems.
- **CAP1 Capstone and record** (wk 24): picoCTF practice set, 20 write-ups published, portfolio README, 5 job
  applications (SOC analyst, security analyst, IT risk/GRC, fraud/fintech risk), the May review.

## Gates (end of each phase, on evidence)
0: terminal, git, repo, room. 1: Bandit 21, Python checkpoints >= 80%, three tools, ledger. 2: subnetting 90%,
Wireshark reads explained, scanner on own lab, engine + journal. 3: Security+ practice 85% and the exam sat; SIEM
running. 4: TLS end to end; Cryptopals 1-2; Sepolia tool. 5: Flask app + threat model; tokenization brief; 20
write-ups; 5 applications.

## Companion: Flipper Zero (hardware track, runs alongside the phases)
- **FLIP1 (shipped 22 Nov 2026)** - Flipper Zero I: the device and its subsystems; the law (sanctioned targets,
  s.342.1/430(1.1), Radiocommunication Act transmit/jamming); official vs custom firmware and the region/TX-power legal
  line; infrared (learn/replay his own appliances, a universal remote); GPIO/UART (read his own Arduino's serial).
  7 steps, phase "Hardware", all hands-on on his own gear. Placed after SETUP1; radio/RFID/NFC held for FLIP2.
- **FLIP2 (outline; write after Phase 4 / crypto, wk ~20-21)** - the transmit and credential subsystems, mechanism-
  first now that crypto is in hand. One idea per step, own devices and sanctioned ranges only, every attack paired with
  its defence:
  - sub-GHz (CC1101): OOK/ASK vs FSK; fixed code vs rolling code (KeeLoq-style) on HIS OWN remotes; why fixed codes fall
    and rolling codes defend; transmit is regulated and jamming is never a lab exercise. Defence: rolling-code, treat RF
    as untrusted input.
  - 125 kHz RFID (EM4100 / HID Prox): read HIS OWN fob; why unencrypted low-frequency prox is clonable; defence = move
    to 13.56 MHz with real crypto.
  - 13.56 MHz NFC (Mifare Classic Crypto1 -> DESFire): the broken Crypto1 cipher (ties straight to the crypto phase) on
    HIS OWN card; why DESFire and modern cards are the fix.
  - BadUSB (USB HID injection): the mechanism, then the DEFENCE on his own PC (screen lock, USB device control, endpoint
    policy, disabling untrusted HID).
  - Capstone brief: audit the access controls he personally owns (home, car, accounts) and specify the upgrade - the
    builder-defender close.
