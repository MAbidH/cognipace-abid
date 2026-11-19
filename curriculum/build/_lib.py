"""Helpers for writing modules (12 Oct 2026). Every module: four parts per concept (problem, mechanism, hands, teach-back),
a gift, a Horizon lesson, links where anything is installed or registered, keyboard first, one action per message."""

FROM_ZERO = ("FROM ZERO: she is a beginner at everything - define every new word the first time, in one plain line, and ask her to say it back. "
             "One action per message; wait for what she sees. WHAT / WHY / WHAT FOR in the first message. ")
LINUX = ("Her machine is Linux Mint (Cinnamon), installed by her: terminal Ctrl+Alt+T, Super is the Windows-logo key, programs come from apt. "
         "Never give Windows instructions. ")
LAB = ("LAB RULE, said by her in her own words before any hands-on part: only her own machines and her own network; nothing is ever aimed at anything she does not own; every attack idea is taught only to explain its defence, and the defence is the part she must be able to do. ")
HORIZON = ("HORIZON: this is the wider-world lesson of the module - who else uses this, how states bend it, how criminals abuse it, how defenders answer - taught as mechanism, never opinion, examples from many countries, Bangladesh one among many. Draw one small picture. End with two questions: 'which part protects and which part controls?' and the Boundary Question for the module. ")

def lesson(id, title, objectives, brief, links=None, media=None, max_turns=None):
    s = {"id": id, "kind": "lesson", "title": title, "objectives": objectives, "tutor_brief": brief}
    if links: s["links"] = links
    if media: s["media"] = media
    if max_turns: s["max_turns"] = max_turns
    return s

def code(id, title, objectives, starter, brief):
    return {"id": id, "kind": "code", "title": title, "objectives": objectives, "starter": starter, "tutor_brief": brief}

def practice(id, title, skills):
    return {"id": id, "kind": "practice", "title": title, "skills": skills}

def check(id, title, skills, count=10, questions=None):
    s = {"id": id, "kind": "check", "title": title, "skills": skills, "count": count}
    if questions: s["questions"] = questions
    return s

def teach(id, prompt, title="Teach it back"):
    return {"id": id, "kind": "teach", "title": title, "prompt": prompt}

def module(id, title, phase, hook, gift_for, gift_what, steps, read=None):
    m = {"id": id, "title": title, "phase": phase, "hook": hook, "gift": {"for": gift_for, "what": gift_what}, "steps": steps}
    if read: m["read"] = read
    return m

def link(label, url, what, file=None):
    l = {"label": label, "url": url, "what": what}
    if file: l["file"] = file
    return l
