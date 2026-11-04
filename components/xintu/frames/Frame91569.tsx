"use client";

type Frame91569Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
};

const Frame91569 = ({ prompt, onPromptChange }: Frame91569Props) => (
        <div className="scroll-container">
            <div
                id="9_1569"
                className="x-frame-9_1569 x-relative-no-shrink x-flex"
            >
                <div className="layout-content-9_1569 x-relative-flex">
                    <div
                        id="9_1570"
                        className="x-frame-9_1570 x-relative-no-shrink"
                    >
                        <div id="9_1571" className="x-frame-9_1571"></div>
                        <div
                            id="9_1572"
                            className="x-frame-9_1572 x-flex"
                        >
                            <div className="layout-content-9_1572 x-relative-flex">
                                <p
                                    id="9_1573"
                                    className="x-copy-9_1573 x-relative-no-shrink"
                                >
                                    {"XINTU"}
                                </p>
                                <div
                                    id="9_1574"
                                    className="border-shell-9_1574 x-relative-no-shrink x-flex"
                                >
                                    <div className="x-frame-9_1574 x-relative-no-shrink x-flex"></div>
                                    <div className="border-line-9_1574"></div>
                                    <div className="x-frame-9_1574-content-layer">
                                        <div className="layout-content-9_1574 x-relative-flex">
                                            <div
                                                id="9_1575"
                                                className="x-icon-9_1575 x-relative-no-shrink"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="9_1579" className="x-heading-9_1579">
                            <p
                                id="9_1579_0"
                                className="x-copy-9_1579_0 x-relative-no-shrink"
                            >
                                {""}
                            </p>
                        </div>
                        <div id="9_1580" className="x-heading-9_1580">
                            <p
                                id="9_1580_0"
                                className="x-copy-9_1580_0 x-relative-no-shrink"
                            >
                                {""}
                            </p>
                        </div>
                        <div id="9_1581" className="border-shell-9_1581">
                            <div className="x-frame-9_1581 x-position-relative">
                                <div
                                    id="9_1582"
                                    className="x-frame-9_1582"
                                ></div>
                                <div
                                    id="9_1583"
                                    className="x-frame-9_1583"
                                ></div>
                                <div
                                    id="9_1584"
                                    className="x-frame-9_1584 x-flex"
                                >
                                    <div className="layout-content-9_1584 x-relative-flex">
                                        <div
                                            id="9_1585"
                                            className="border-shell-9_1585 x-relative-no-shrink x-flex"
                                        >
                                            <div className="x-frame-9_1585 x-relative-no-shrink x-flex"></div>
                                            <div className="border-line-9_1585"></div>
                                            <div className="x-frame-9_1585-content-layer">
                                                <div className="layout-content-9_1585 x-relative-flex">
                                                    <div
                                                        id="9_1586"
                                                        className="x-icon-9_1586 x-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p
                                            id="9_1590"
                                            className="x-copy-9_1590 x-relative-no-shrink"
                                        >
                                            {"上传一张照片"}
                                        </p>
                                        <p
                                            id="9_1591"
                                            className="x-copy-9_1591 x-relative-no-shrink"
                                        >
                                            {"JPG / PNG / WebP"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-line-9_1581"></div>
                        </div>
                        <div
                            id="9_1592"
                            className="border-shell-9_1592 x-flex"
                        >
                            <div className="x-frame-9_1592 x-relative-flex"></div>
                            <div className="border-line-9_1592"></div>
                            <div className="x-frame-9_1592-content-layer">
                                <div className="layout-content-9_1592 x-relative-flex">
                                    <p
                                        id="9_1593"
                                        className="x-copy-9_1593 x-relative-no-shrink"
                                    >
                                        {"描述你想要的气氛"}
                                    </p>
                                    <div className="xintu-prompt-editor mobile">
                                        <textarea
                                            id="xintu-prompt-mobile"
                                            className="xintu-prompt-textarea"
                                            aria-label="描述你想要的调色效果"
                                            maxLength={500}
                                            placeholder="例如：日系、通透，肤色自然，保留皮肤纹理。"
                                            value={prompt}
                                            onChange={(event) => onPromptChange(event.target.value)}
                                        />
                                        <span className="xintu-prompt-count">{prompt.length} / 500</span>
                                    </div>
                                    <div
                                        id="9_1595"
                                        className="x-frame-9_1595 x-relative-no-shrink x-flex"
                                    >
                                        <div className="layout-content-9_1595 x-relative-flex">
                                            <div
                                                id="9_1596"
                                                className="border-shell-9_1596 x-relative-no-shrink x-flex"
                                            >
                                                <div className="x-frame-9_1596 x-relative-no-shrink x-flex"></div>
                                                <div className="border-line-9_1596"></div>
                                                <div className="x-frame-9_1596-content-layer">
                                                    <div className="layout-content-9_1596 x-relative-flex">
                                                        <p
                                                            id="9_1597"
                                                            className="x-copy-9_1597 x-relative-no-shrink"
                                                        >
                                                            {"肤色自然"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                id="9_1598"
                                                className="border-shell-9_1598 x-relative-no-shrink x-flex"
                                            >
                                                <div className="x-frame-9_1598 x-relative-no-shrink x-flex"></div>
                                                <div className="border-line-9_1598"></div>
                                                <div className="x-frame-9_1598-content-layer">
                                                    <div className="layout-content-9_1598 x-relative-flex">
                                                        <p
                                                            id="9_1599"
                                                            className="x-copy-9_1599 x-relative-no-shrink"
                                                        >
                                                            {"低饱和胶片"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="9_1600"
                            className="x-frame-9_1600 x-flex"
                        >
                            <div className="layout-content-9_1600 x-relative-flex">
                                <p
                                    id="9_1601"
                                    className="x-copy-9_1601 x-relative-no-shrink"
                                >
                                    {"强度"}
                                </p>
                                <div
                                    id="9_1602"
                                    className="x-frame-9_1602 x-relative-no-shrink x-flex"
                                >
                                    <div className="layout-content-9_1602 x-relative-flex">
                                        <p
                                            id="9_1603"
                                            className="x-copy-9_1603 x-relative-no-shrink"
                                        >
                                            {"弱"}
                                        </p>
                                        <div
                                            id="9_1604"
                                            className="x-frame-9_1604 x-relative-no-shrink x-flex"
                                        >
                                            <div className="layout-content-9_1604 x-relative-flex">
                                                <p
                                                    id="9_1605"
                                                    className="x-copy-9_1605 x-relative-no-shrink"
                                                >
                                                    {"中"}
                                                </p>
                                            </div>
                                        </div>
                                        <p
                                            id="9_1606"
                                            className="x-copy-9_1606 x-relative-no-shrink"
                                        >
                                            {"强"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="9_1607"
                            className="border-shell-9_1607 x-flex"
                        >
                            <div className="x-frame-9_1607 x-relative-flex"></div>
                            <div className="border-line-9_1607"></div>
                            <div className="x-frame-9_1607-content-layer">
                                <div className="layout-content-9_1607 x-relative-flex">
                                    <div
                                        id="9_1608"
                                        className="x-frame-9_1608 x-relative-no-shrink x-flex"
                                    >
                                        <div className="layout-content-9_1608 x-relative-flex">
                                            <p
                                                id="9_1609"
                                                className="x-copy-9_1609 x-relative-no-shrink"
                                            >
                                                {"参考图追色"}
                                            </p>
                                            <p
                                                id="9_1610"
                                                className="x-copy-9_1610 x-relative-no-shrink"
                                            >
                                                {"可选，上传一张参考图片"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        id="9_1611"
                                        className="x-frame-9_1611 x-relative-no-shrink x-flex"
                                    >
                                        <div className="layout-content-9_1611 x-relative-flex">
                                            <div
                                                id="9_1612"
                                                className="x-icon-9_1612 x-relative-no-shrink"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="9_1615"
                            className="x-frame-9_1615 x-flex"
                        >
                            <div className="layout-content-9_1615 x-relative-flex">
                                <p
                                    id="9_1616"
                                    className="x-copy-9_1616 x-relative-no-shrink"
                                >
                                    {"生成 3 个候选"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
);
export default Frame91569;
