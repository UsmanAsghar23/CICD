resource "aws_route53_record" "preview_wildcard" {
  zone_id = var.route53_zone_id
  name    = local.preview_wildcard
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "preview_base" {
  zone_id = var.route53_zone_id
  name    = local.preview_base_domain
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
