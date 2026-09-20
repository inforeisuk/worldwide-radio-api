from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in ['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'audio', 'polyline', 'line', 'svg', 'path', 'circle', 'rect', 'polygon']:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag not in ['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'audio', 'svg', 'polyline', 'line', 'path', 'circle', 'rect', 'polygon']:
            if not self.stack:
                print(f"Extra end tag: {tag} at {self.getpos()}")
                return
            expected_tag, pos = self.stack.pop()
            if expected_tag != tag:
                print(f"Mismatched tag: expected {expected_tag} (from {pos}), got {tag} at {self.getpos()}")

    def close(self):
        super().close()
        for tag, pos in self.stack:
            print(f"Unclosed tag: {tag} at {pos}")

parser = MyHTMLParser()
with open("src/public/index.html", "r") as f:
    parser.feed(f.read())
parser.close()
