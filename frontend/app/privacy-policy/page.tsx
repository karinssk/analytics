import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                        <p className="text-muted-foreground">Last updated: December 20, 2024</p>
                    </CardHeader>
                    <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold mt-6">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Welcome to RubyShop App (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy
                                and ensuring the security of your personal information. This Privacy Policy explains how we collect,
                                use, disclose, and safeguard your information when you use our application and services.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">2. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may collect the following types of information:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li><strong>Personal Information:</strong> Name, email address, phone number, and address when you provide them through messaging.</li>
                                <li><strong>Account Information:</strong> Facebook/LINE user ID and profile information when you connect through social platforms.</li>
                                <li><strong>Communication Data:</strong> Messages and conversations you send through our integrated messaging platforms.</li>
                                <li><strong>Usage Data:</strong> Information about how you interact with our services.</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">3. How We Use Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use the collected information for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>To provide and maintain our services</li>
                                <li>To respond to your inquiries and fulfill your requests</li>
                                <li>To process and manage your orders</li>
                                <li>To send you important updates and notifications</li>
                                <li>To improve our services and user experience</li>
                                <li>To comply with legal obligations</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">4. Information Sharing</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We do not sell, trade, or rent your personal information to third parties. We may share your
                                information only in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>With your consent</li>
                                <li>To comply with legal requirements</li>
                                <li>To protect our rights and safety</li>
                                <li>With service providers who assist in our operations</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">5. Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We implement appropriate technical and organizational security measures to protect your personal
                                information against unauthorized access, alteration, disclosure, or destruction. However, no
                                method of transmission over the Internet is 100% secure.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">6. Data Retention</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We retain your personal information for as long as necessary to provide our services and fulfill
                                the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">7. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Access your personal information</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Withdraw consent at any time</li>
                                <li>Lodge a complaint with a supervisory authority</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">8. Third-Party Services</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our application integrates with third-party services including Facebook Messenger and LINE.
                                These services have their own privacy policies, and we encourage you to review them.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">9. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by
                                posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">10. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <p className="text-muted-foreground">
                                <strong>Email:</strong> rubydeveloper168@gmail.com
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
