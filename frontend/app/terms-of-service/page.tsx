import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Terms of Service</CardTitle>
                        <p className="text-muted-foreground">Last updated: December 20, 2024</p>
                    </CardHeader>
                    <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using RubyShop App (&quot;the Service&quot;), you agree to be bound by these Terms of
                                Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Service.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">2. Description of Service</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                RubyShop App provides customer communication and analytics services through integrated messaging
                                platforms including Facebook Messenger and LINE. Our Service helps businesses manage customer
                                interactions and gather insights from conversations.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">3. User Accounts</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                When you connect through Facebook or LINE, you authorize us to access certain information from
                                your account as permitted by these platforms. You are responsible for maintaining the
                                confidentiality of your account and for all activities that occur under your account.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">4. Acceptable Use</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You agree not to use the Service to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Infringe upon the rights of others</li>
                                <li>Send spam, unsolicited messages, or harmful content</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Interfere with or disrupt the Service</li>
                                <li>Collect user data without proper consent</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">5. Intellectual Property</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The Service and its original content, features, and functionality are owned by RubyShop and are
                                protected by international copyright, trademark, patent, trade secret, and other intellectual
                                property laws.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">6. User Content</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You retain ownership of any content you submit through our Service. By submitting content, you
                                grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your
                                content solely for the purpose of providing and improving the Service.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">7. Third-Party Services</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our Service integrates with third-party platforms (Facebook, LINE). Your use of these
                                integrations is subject to the respective terms and policies of those platforms. We are not
                                responsible for the content, privacy policies, or practices of third-party services.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">8. Disclaimer of Warranties</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The Service is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either
                                express or implied, including but not limited to implied warranties of merchantability, fitness
                                for a particular purpose, or non-infringement.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">9. Limitation of Liability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To the maximum extent permitted by law, RubyShop shall not be liable for any indirect,
                                incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
                                whether incurred directly or indirectly, or any loss of data, use, goodwill, or other
                                intangible losses.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">10. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may terminate or suspend your access to the Service immediately, without prior notice or
                                liability, for any reason, including breach of these Terms. Upon termination, your right to
                                use the Service will cease immediately.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">11. Changes to Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We reserve the right to modify these Terms at any time. We will provide notice of significant
                                changes by updating the &quot;Last updated&quot; date. Your continued use of the Service after changes
                                constitutes acceptance of the modified Terms.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">12. Governing Law</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of Thailand,
                                without regard to its conflict of law provisions.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">13. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about these Terms, please contact us at:
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
