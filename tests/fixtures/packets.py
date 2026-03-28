"""Factory functions for creating mock scapy packets without root privileges."""

import time

from scapy.all import Ether, IP, TCP, UDP, ARP, ICMP, DNS, DNSQR, Raw


# Deterministic base time and MAC pool
BASE_TIME = 1711612800.0  # 2024-03-28 12:00:00 UTC
MAC_POOL = [f"aa:bb:cc:00:00:{i:02x}" for i in range(1, 17)]
IP_POOL = [f"192.168.1.{i}" for i in range(1, 17)]


def make_dns_query(src_ip="192.168.1.100", dst_ip="192.168.1.1", domain="example.com", offset=0):
    """Create a DNS query packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / UDP(sport=12345, dport=53)
        / DNS(rd=1, qd=DNSQR(qname=domain))
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_dns_response(src_ip="192.168.1.1", dst_ip="192.168.1.100", domain="example.com", offset=0.1):
    """Create a DNS response packet."""
    pkt = (
        Ether(src=MAC_POOL[1], dst=MAC_POOL[0])
        / IP(src=src_ip, dst=dst_ip)
        / UDP(sport=53, dport=12345)
        / DNS(rd=1, qd=DNSQR(qname=domain), an=None)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_http_syn(src_ip="192.168.1.100", dst_ip="93.184.216.34", dst_port=80, offset=1):
    """Create an HTTP SYN packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54321, dport=dst_port, flags="S")
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_http_request(src_ip="192.168.1.100", dst_ip="93.184.216.34", payload=b"GET / HTTP/1.1\r\n", offset=2):
    """Create an HTTP request packet with payload."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54321, dport=80, flags="PA")
        / Raw(load=payload)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_https_packet(src_ip="192.168.1.100", dst_ip="93.184.216.34", offset=3):
    """Create an HTTPS (TLS) packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54322, dport=443, flags="PA")
        / Raw(load=b"\x16\x03\x01")  # TLS Client Hello start
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_ssh_packet(src_ip="192.168.1.100", dst_ip="192.168.1.50", offset=4):
    """Create an SSH packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[2])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54323, dport=22, flags="PA")
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_smb_packet(src_ip="192.168.1.100", dst_ip="192.168.1.10", offset=5):
    """Create an SMB packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[3])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54324, dport=445, flags="PA")
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_arp_request(src_ip="192.168.1.100", src_mac="aa:bb:cc:00:00:01", target_ip="192.168.1.1", offset=6):
    """Create an ARP who-has request."""
    pkt = (
        Ether(src=src_mac, dst="ff:ff:ff:ff:ff:ff")
        / ARP(op="who-has", psrc=src_ip, hwsrc=src_mac, pdst=target_ip)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_arp_reply(src_ip="192.168.1.1", src_mac="aa:bb:cc:00:00:02", dst_ip="192.168.1.100", dst_mac="aa:bb:cc:00:00:01", offset=6.1):
    """Create an ARP is-at reply."""
    pkt = (
        Ether(src=src_mac, dst=dst_mac)
        / ARP(op="is-at", psrc=src_ip, hwsrc=src_mac, pdst=dst_ip, hwdst=dst_mac)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_mdns_packet(src_ip="192.168.1.100", hostname="myhost.local", offset=7):
    """Create an mDNS packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst="01:00:5e:00:00:fb")
        / IP(src=src_ip, dst="224.0.0.251")
        / UDP(sport=5353, dport=5353)
        / DNS(qd=DNSQR(qname=hostname))
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_icmp_packet(src_ip="192.168.1.100", dst_ip="192.168.1.1", offset=8):
    """Create an ICMP echo request."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / ICMP(type=8, code=0)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_ntp_packet(src_ip="192.168.1.100", dst_ip="129.6.15.28", offset=9):
    """Create an NTP packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[1])
        / IP(src=src_ip, dst=dst_ip)
        / UDP(sport=12346, dport=123)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_dhcp_packet(src_ip="0.0.0.0", dst_ip="255.255.255.255", offset=10):
    """Create a DHCP discover packet."""
    pkt = (
        Ether(src=MAC_POOL[0], dst="ff:ff:ff:ff:ff:ff")
        / IP(src=src_ip, dst=dst_ip)
        / UDP(sport=68, dport=67)
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_unknown_port_packet(src_ip="192.168.1.100", dst_ip="10.0.0.1", dst_port=9999, offset=11):
    """Create a TCP packet on an unknown port."""
    pkt = (
        Ether(src=MAC_POOL[0], dst=MAC_POOL[4])
        / IP(src=src_ip, dst=dst_ip)
        / TCP(sport=54325, dport=dst_port, flags="PA")
    )
    pkt.time = BASE_TIME + offset
    return pkt


def make_truncated_packet(offset=12):
    """Create a truncated/malformed packet (Ether only, no IP)."""
    pkt = Ether(src=MAC_POOL[0], dst=MAC_POOL[1]) / Raw(load=b"\x00\x01")
    pkt.time = BASE_TIME + offset
    return pkt


def make_corrupt_packet(offset=13):
    """Create completely corrupt data as a Raw packet."""
    pkt = Raw(load=b"\xff\xfe\xfd\xfc\xfb\xfa")
    pkt.time = BASE_TIME + offset
    return pkt


def make_mixed_packet_list():
    """Create a list of ~20 packets covering all protocol types."""
    return [
        make_dns_query(offset=0),
        make_dns_response(offset=0.1),
        make_http_syn(offset=1),
        make_http_request(offset=2),
        make_https_packet(offset=3),
        make_ssh_packet(offset=4),
        make_smb_packet(offset=5),
        make_arp_request(offset=6),
        make_arp_reply(offset=6.1),
        make_mdns_packet(offset=7),
        make_icmp_packet(offset=8),
        make_ntp_packet(offset=9),
        make_dhcp_packet(offset=10),
        make_unknown_port_packet(offset=11),
        make_dns_query(src_ip="192.168.1.50", offset=12),
        make_https_packet(src_ip="192.168.1.50", offset=13),
        make_http_syn(src_ip="192.168.1.50", dst_port=8080, offset=14),
        make_ssh_packet(src_ip="192.168.1.50", offset=15),
        make_icmp_packet(src_ip="192.168.1.50", offset=16),
        make_https_packet(offset=17),
    ]
