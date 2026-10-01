# Matronics — PS5 Relapse Host

**Developer:** Matronics  
**Contact:** +961 70962701  
**Site:** https://matronics1360.github.io/

Made by experts from Lebanon.

Supported firmware: **7.00 through 13.60**.

## Usage

1. Open the host on your PS5 browser: `https://matronics1360.github.io/`
2. **First run (online):** wait until it says cached for offline use, then the exploit runs
3. **Later runs:** you can open the same link **offline** (AppCache, same idea as PS4 hosts)
4. Default payloads are in `payloads/`
5. After a successful run, the ELF loader listens on port **9021**

## Stability notes

- WebKit may need several attempts — reload the page if the browser stalls
- The kernel stage may hang or panic the console — reboot before trying again if that happens

## About this build

This Matronics host packages and presents the PS5 Relapse chain for supported firmware:

- Browser stage: JSC info leaks + structured clone object pool mismatch → typedarray corruption
- Kernel stage: address leak + `aio_multi_wait` UAF race → kernel r/w

## Disclaimer

For **educational and security research** on devices you own or are authorized to test.  
No piracy or unauthorized access. Comply with applicable laws.

Provided as-is, without warranty. You assume all risk (instability, data loss, bans).  
Matronics accepts no liability for resulting damage.
