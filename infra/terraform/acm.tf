resource "aws_acm_certificate" "preview" {
  domain_name               = local.preview_wildcard
  subject_alternative_names = [local.preview_base_domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "preview_cert_validation" {
  for_each = {
    for option in aws_acm_certificate.preview.domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "preview" {
  certificate_arn         = aws_acm_certificate.preview.arn
  validation_record_fqdns = [for record in aws_route53_record.preview_cert_validation : record.fqdn]
}
