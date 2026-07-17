import {
    Head,
    Html,
    Font,
    Preview,
    Heading,
    Row,
    Section,
    Text,
    Button
} from "@react-email/components";

interface VerificationEmailProps {
    username: string;
    otp: string;
}

export default function VerificationEmail({ username, otp }: VerificationEmailProps) {
    return(
        <Html lang="en" dir="ltr">
            <Head>
                <title>Verification Code</title>
                <Font
                    fontFamily="Roboto"
                    fallbackFontFamily="Verdana"
                    webFont={{
                        url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
                        format: "woff2"
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>Your verification code: {otp}</Preview>
            <Section>
                <Row>
                    <Heading as="h2">Hello {username},</Heading>
                </Row>
                <Row>
                    <Text>Thank you for using our service. Your verification code is:</Text>
                </Row>
                <Row>
                    <Row>{otp}</Row>
                </Row>
                <Row>
                    <Text>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</Text>
                </Row>
            </Section>
        </Html>
    );
}